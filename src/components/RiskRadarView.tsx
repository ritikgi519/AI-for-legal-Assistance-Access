/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  CriticalClauseAudit, 
  RiskRadarNode, 
  RiskRewardQuadrant, 
  RadarCategoryAggregate 
} from '../types';
import { 
  buildRiskRadarData, 
  getQuadrantMeta 
} from '../utils/riskRadarCalculator';
import { 
  Crosshair, 
  Radar, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  Scale, 
  SlidersHorizontal, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  ExternalLink,
  Filter,
  Maximize2
} from 'lucide-react';

interface RiskRadarViewProps {
  clauses: CriticalClauseAudit[];
  docTitle?: string;
  onNavigateToClause?: (clauseId: string) => void;
}

export const RiskRadarView: React.FC<RiskRadarViewProps> = ({
  clauses,
  docTitle = '',
  onNavigateToClause
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'spider'>('matrix');
  const [selectedQuadrant, setSelectedQuadrant] = useState<RiskRewardQuadrant | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeNode, setActiveNode] = useState<RiskRadarNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<RiskRadarNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute calculated radar dataset
  const { nodes, categoryAggregates, quadrantCounts } = useMemo(() => {
    return buildRiskRadarData(clauses, docTitle);
  }, [clauses, docTitle]);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set(nodes.map(n => n.category));
    return Array.from(set).sort();
  }, [nodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchQuad = selectedQuadrant === 'ALL' || node.quadrant === selectedQuadrant;
      const matchCat = selectedCategory === 'ALL' || node.category === selectedCategory;
      return matchQuad && matchCat;
    });
  }, [nodes, selectedQuadrant, selectedCategory]);

  // Auto-select first critical node if none selected
  useEffect(() => {
    if (!activeNode && nodes.length > 0) {
      const firstToxic = nodes.find(n => n.quadrant === 'TOXIC_PITFALL') || nodes[0];
      setActiveNode(firstToxic);
    }
  }, [nodes, activeNode]);

  // ---------------------------------------------------------------------------
  // D3 RENDERING ENGINE: RISK-REWARD MATRIX
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || viewMode !== 'matrix') return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 760;
    const height = 560;
    const margin = { top: 40, right: 40, bottom: 60, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Quadrant Gradients
    // 1. Toxic Pitfall (Bottom-Right: X >= 50, Y < 50)
    const toxicGrad = defs.append('radialGradient')
      .attr('id', 'grad-toxic')
      .attr('cx', '100%').attr('cy', '100%').attr('r', '80%');
    toxicGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.15);
    toxicGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a').attr('stop-opacity', 0.02);

    // 2. Strategic Bet (Top-Right: X >= 50, Y >= 50)
    const betGrad = defs.append('radialGradient')
      .attr('id', 'grad-bet')
      .attr('cx', '100%').attr('cy', '0%').attr('r', '80%');
    betGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.12);
    betGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a').attr('stop-opacity', 0.02);

    // 3. Golden Covenant (Top-Left: X < 50, Y >= 50)
    const goldenGrad = defs.append('radialGradient')
      .attr('id', 'grad-golden')
      .attr('cx', '0%').attr('cy', '0%').attr('r', '80%');
    goldenGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.12);
    goldenGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a').attr('stop-opacity', 0.02);

    // 4. Boilerplate (Bottom-Left: X < 50, Y < 50)
    const bpGrad = defs.append('radialGradient')
      .attr('id', 'grad-bp')
      .attr('cx', '0%').attr('cy', '100%').attr('r', '80%');
    bpGrad.append('stop').attr('offset', '0%').attr('stop-color', '#64748b').attr('stop-opacity', 0.08);
    bpGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a').attr('stop-opacity', 0.02);

    // Glow filter for nodes
    const glowFilter = defs.append('filter')
      .attr('id', 'radar-glow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Quadrant Background Rectangles
    // Top-Left: Golden Covenants
    g.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', innerWidth / 2).attr('height', innerHeight / 2)
      .attr('fill', 'url(#grad-golden)')
      .attr('stroke', '#1e293b').attr('stroke-width', 1);

    // Top-Right: Strategic Bets
    g.append('rect')
      .attr('x', innerWidth / 2).attr('y', 0)
      .attr('width', innerWidth / 2).attr('height', innerHeight / 2)
      .attr('fill', 'url(#grad-bet)')
      .attr('stroke', '#1e293b').attr('stroke-width', 1);

    // Bottom-Left: Standard Boilerplate
    g.append('rect')
      .attr('x', 0).attr('y', innerHeight / 2)
      .attr('width', innerWidth / 2).attr('height', innerHeight / 2)
      .attr('fill', 'url(#grad-bp)')
      .attr('stroke', '#1e293b').attr('stroke-width', 1);

    // Bottom-Right: Toxic Pitfalls
    g.append('rect')
      .attr('x', innerWidth / 2).attr('y', innerHeight / 2)
      .attr('width', innerWidth / 2).attr('height', innerHeight / 2)
      .attr('fill', 'url(#grad-toxic)')
      .attr('stroke', '#1e293b').attr('stroke-width', 1);

    // Quadrant Watermark Labels
    const quadrantLabels = [
      { text: 'GOLDEN COVENANTS', sub: 'Low Risk · High Upside', x: 16, y: 24, fill: '#10b981' },
      { text: 'STRATEGIC BETS', sub: 'High Risk · High Upside', x: innerWidth - 16, y: 24, fill: '#f59e0b', anchor: 'end' },
      { text: 'STANDARD BOILERPLATE', sub: 'Low Risk · Low Upside', x: 16, y: innerHeight - 24, fill: '#64748b' },
      { text: 'TOXIC PITFALLS', sub: 'High Risk · Low Upside', x: innerWidth - 16, y: innerHeight - 24, fill: '#f43f5e', anchor: 'end' }
    ];

    quadrantLabels.forEach(ql => {
      g.append('text')
        .attr('x', ql.x)
        .attr('y', ql.y)
        .attr('text-anchor', ql.anchor || 'start')
        .attr('fill', ql.fill)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.08em')
        .attr('opacity', 0.6)
        .text(ql.text);

      g.append('text')
        .attr('x', ql.x)
        .attr('y', ql.y + 12)
        .attr('text-anchor', ql.anchor || 'start')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.45)
        .text(ql.sub);
    });

    // Grid lines
    const gridTicks = [25, 50, 75];
    gridTicks.forEach(tick => {
      // Horizontal
      g.append('line')
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', yScale(tick)).attr('y2', yScale(tick))
        .attr('stroke', tick === 50 ? '#475569' : '#1e293b')
        .attr('stroke-width', tick === 50 ? 1.5 : 1)
        .attr('stroke-dasharray', tick === 50 ? '4,4' : '2,2');

      // Vertical
      g.append('line')
        .attr('x1', xScale(tick)).attr('x2', xScale(tick))
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', tick === 50 ? '#475569' : '#1e293b')
        .attr('stroke-width', tick === 50 ? 1.5 : 1)
        .attr('stroke-dasharray', tick === 50 ? '4,4' : '2,2');
    });

    // Custom Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`);

    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', '#334155');
    xAxisG.selectAll('.tick line').attr('stroke', '#334155');
    xAxisG.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');

    const yAxisG = g.append('g').call(yAxis);
    yAxisG.select('.domain').attr('stroke', '#334155');
    yAxisG.selectAll('.tick line').attr('stroke', '#334155');
    yAxisG.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');

    // Axis Titles
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.04em')
      .text('CONTRACTUAL RISK & LIABILITY EXPOSURE → (0% Safe to 100% Critical)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.04em')
      .text('STRATEGIC VALUE & OPERATIONAL REWARD → (0% Nil to 100% High Equity)');

    // Render Nodes (with force simulation or slight jitter to prevent overlapping)
    const simulationData = filteredNodes.map(n => ({
      ...n,
      x: xScale(n.riskScore),
      y: yScale(n.rewardScore),
      targetX: xScale(n.riskScore),
      targetY: yScale(n.rewardScore)
    }));

    // Soft collision force to prevent complete overlap
    const simulation = d3.forceSimulation(simulationData as any)
      .force('x', d3.forceX((d: any) => d.targetX).strength(0.8))
      .force('y', d3.forceY((d: any) => d.targetY).strength(0.8))
      .force('collide', d3.forceCollide((d: any) => d.blastRadius + 3).iterations(3))
      .stop();

    // Run 40 ticks
    for (let i = 0; i < 40; ++i) simulation.tick();

    // Node groups
    const nodeGroups = g.selectAll('.radar-node')
      .data(simulationData)
      .enter()
      .append('g')
      .attr('class', 'radar-node')
      .attr('transform', (d: any) => `translate(${Math.max(16, Math.min(innerWidth - 16, d.x))},${Math.max(16, Math.min(innerHeight - 16, d.y))})`)
      .style('cursor', 'pointer');

    // Pulsing halo for CRITICAL severity
    nodeGroups.filter((d: any) => d.riskLevel === 'CRITICAL')
      .append('circle')
      .attr('r', (d: any) => d.blastRadius + 7)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6)
      .append('animate')
      .attr('attributeName', 'r')
      .attr('values', (d: any) => `${d.blastRadius + 4};${d.blastRadius + 11};${d.blastRadius + 4}`)
      .attr('dur', '2.5s')
      .attr('repeatCount', 'indefinite');

    // Base circle with glow
    nodeGroups.append('circle')
      .attr('r', (d: any) => d.blastRadius)
      .attr('fill', (d: any) => {
        const meta = getQuadrantMeta(d.quadrant);
        return meta.color;
      })
      .attr('fill-opacity', 0.82)
      .attr('stroke', (d: any) => {
        return activeNode?.id === d.id ? '#ffffff' : '#0f172a';
      })
      .attr('stroke-width', (d: any) => activeNode?.id === d.id ? 2.5 : 1.5)
      .style('filter', 'url(#radar-glow)')
      .style('transition', 'all 0.2s ease');

    // Inner icon or label
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text((d: any) => {
        // e.g. "11.2" or short ID
        const match = d.clauseId.match(/\d+(\.\d+)?/);
        return match ? match[0] : d.clauseId.slice(0, 3);
      });

    // Interactivity
    nodeGroups
      .on('mouseenter', function (event, d: any) {
        d3.select(this).select('circle')
          .attr('transform', 'scale(1.25)')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 3);

        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          setTooltipPos({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
          });
        }
        setHoveredNode(d);
      })
      .on('mousemove', function (event) {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          setTooltipPos({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
          });
        }
      })
      .on('mouseleave', function (_event, d: any) {
        d3.select(this).select('circle')
          .attr('transform', 'scale(1)')
          .attr('stroke', activeNode?.id === d.id ? '#ffffff' : '#0f172a')
          .attr('stroke-width', activeNode?.id === d.id ? 2.5 : 1.5);
        setHoveredNode(null);
      })
      .on('click', function (_event, d: any) {
        setActiveNode(d);
      });

  }, [viewMode, filteredNodes, activeNode]);

  // ---------------------------------------------------------------------------
  // D3 RENDERING ENGINE: MULTI-AXIS SPIDER RADAR
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || viewMode !== 'spider') return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 760;
    const height = 560;
    const radius = Math.min(width, height) / 2 - 70;
    const centerX = width / 2;
    const centerY = height / 2;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    const data = categoryAggregates.slice(0, 6);
    if (data.length < 3) return;

    const totalAxes = data.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Radius scale
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric polygon grid levels
    const levels = [20, 40, 60, 80, 100];
    levels.forEach(level => {
      const levelFactor = radius * (level / 100);

      // Grid line
      const points = d3.range(totalAxes).map(i => {
        const x = levelFactor * Math.cos(angleSlice * i - Math.PI / 2);
        const y = levelFactor * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
      }).join(' ');

      g.append('polygon')
        .attr('points', points)
        .attr('stroke', '#334155')
        .attr('stroke-width', 1)
        .attr('fill', level === 100 ? '#0f172a' : 'none')
        .attr('fill-opacity', 0.2);

      // Level label
      g.append('text')
        .attr('x', 4)
        .attr('y', -levelFactor)
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`${level}%`);
    });

    // Radial axis lines & category labels
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Axis line
      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', x).attr('y2', y)
        .attr('stroke', '#334155')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      // Category label position
      const labelRadius = radius + 32;
      const labelX = labelRadius * Math.cos(angle);
      const labelY = labelRadius * Math.sin(angle);

      const labelG = g.append('g')
        .attr('transform', `translate(${labelX},${labelY})`);

      labelG.append('text')
        .attr('text-anchor', Math.abs(labelX) < 10 ? 'middle' : labelX > 0 ? 'start' : 'end')
        .attr('dominant-baseline', Math.abs(labelY) < 10 ? 'middle' : labelY > 0 ? 'hanging' : 'auto')
        .attr('fill', '#f8fafc')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(d.category);

      labelG.append('text')
        .attr('text-anchor', Math.abs(labelX) < 10 ? 'middle' : labelX > 0 ? 'start' : 'end')
        .attr('y', labelY > 0 ? 14 : -12)
        .attr('fill', d.avgRisk >= 60 ? '#f43f5e' : '#f59e0b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`Risk: ${d.avgRisk}% · ${d.count} Clauses`);
    });

    // 1. RISK POLYGON PATH
    const riskCoords = data.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [
        rScale(d.avgRisk) * Math.cos(angle),
        rScale(d.avgRisk) * Math.sin(angle)
      ];
    });

    // Defs for polygon gradient
    const defs = svg.append('defs');
    const polyGrad = defs.append('radialGradient')
      .attr('id', 'spider-risk-grad')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    polyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.4);
    polyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.15);

    g.append('polygon')
      .attr('points', riskCoords.map(c => c.join(',')).join(' '))
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2.5)
      .attr('fill', 'url(#spider-risk-grad)');

    // 2. REWARD POLYGON PATH (Comparative)
    const rewardCoords = data.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [
        rScale(d.avgReward) * Math.cos(angle),
        rScale(d.avgReward) * Math.sin(angle)
      ];
    });

    g.append('polygon')
      .attr('points', rewardCoords.map(c => c.join(',')).join(' '))
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.1);

    // Interactive circular markers
    riskCoords.forEach((coord, i) => {
      const d = data[i];
      g.append('circle')
        .attr('cx', coord[0])
        .attr('cy', coord[1])
        .attr('r', 5)
        .attr('fill', '#f43f5e')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .append('title')
        .text(`${d.category}: ${d.avgRisk}% Average Risk (${d.count} clauses)`);
    });

    rewardCoords.forEach((coord, i) => {
      const d = data[i];
      g.append('circle')
        .attr('cx', coord[0])
        .attr('cy', coord[1])
        .attr('r', 4.5)
        .attr('fill', '#10b981')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .append('title')
        .text(`${d.category}: ${d.avgReward}% Average Strategic Upside`);
    });

  }, [viewMode, categoryAggregates]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Contractual Risk Radar & Value Matrix
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30">
                  D3 Vector Audit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spatial mapping of contractual covenants across liability exposure (Risk) vs. commercial protective value (Reward)
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>2D Risk-Reward Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spider')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'spider'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Multi-Axis Spider Radar</span>
            </button>
          </div>
        </div>

        {/* Quadrant Quick Filters & Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {(['TOXIC_PITFALL', 'STRATEGIC_BET', 'GOLDEN_COVENANT', 'STANDARD_BOILERPLATE'] as RiskRewardQuadrant[]).map(quad => {
            const meta = getQuadrantMeta(quad);
            const count = quadrantCounts[quad] || 0;
            const isSelected = selectedQuadrant === quad;

            return (
              <button
                key={quad}
                type="button"
                onClick={() => setSelectedQuadrant(isSelected ? 'ALL' : quad)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${meta.bgColor} ${meta.borderColor} ring-1 ring-${meta.color}`
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-bold ${meta.textColor}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {count}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {meta.shortDesc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Secondary Category Filter */}
        {viewMode === 'matrix' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 shrink-0 font-medium">
              <Filter className="w-3 h-3" /> Filter Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-750 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              All Categories ({nodes.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'ALL' : cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Workspace: D3 Visualization & Deep Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: D3 Interactive Canvas */}
        <div 
          ref={containerRef}
          className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[580px]"
        >
          {/* Header Indicator */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2 pb-2 border-b border-slate-800/80">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {viewMode === 'matrix' 
                  ? `Interactive Scatter Matrix (${filteredNodes.length} clauses plotted)`
                  : `Hexagonal Radar Polar Distribution (${categoryAggregates.length} vectors)`}
              </span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Click node to inspect
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="w-full aspect-[4/3] flex items-center justify-center">
            <svg 
              ref={svgRef} 
              className="w-full h-full select-none"
            />
          </div>

          {/* Floating Hover Tooltip */}
          {hoveredNode && tooltipPos && (
            <div 
              style={{
                position: 'absolute',
                left: `${Math.min(tooltipPos.x + 12, 480)}px`,
                top: `${Math.max(tooltipPos.y - 12, 40)}px`,
                pointerEvents: 'none',
                zIndex: 30
              }}
              className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl max-w-xs space-y-1.5 text-left backdrop-blur-md animate-fadeIn"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white font-mono truncate">
                  {hoveredNode.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${getQuadrantMeta(hoveredNode.quadrant).badgeBg}`}>
                  {hoveredNode.riskLevel}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                {hoveredNode.plainEnglishMeaning}
              </div>
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-slate-800 text-slate-400">
                <span>Risk: <strong className="text-rose-400">{hoveredNode.riskScore}%</strong></span>
                <span>Upside: <strong className="text-emerald-400">{hoveredNode.rewardScore}%</strong></span>
              </div>
            </div>
          )}

          {/* Spider Legend */}
          {viewMode === 'spider' && (
            <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-300">Liability Risk Burden</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Protective Upside Equity</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Clause Deep Inspection Card */}
        <div className="lg:col-span-5 space-y-4">
          {activeNode ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {activeNode.clauseId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      · {activeNode.category}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Line {activeNode.lineNumber || 'N/A'} · Favors: <span className="text-amber-300">{activeNode.partyFavored}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${getQuadrantMeta(activeNode.quadrant).badgeBg}`}>
                    {getQuadrantMeta(activeNode.quadrant).label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {getQuadrantMeta(activeNode.quadrant).action}
                  </div>
                </div>
              </div>

              {/* Spatial Metrics Dual Bar */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Risk Severity:</span>
                    <span className="text-rose-400 font-bold">{activeNode.riskScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-500" 
                      style={{ width: `${activeNode.riskScore}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Strategic Upside:</span>
                    <span className="text-emerald-400 font-bold">{activeNode.rewardScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${activeNode.rewardScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Plain English Translation */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plain-English Breakdown</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                  {activeNode.plainEnglishMeaning}
                </div>
              </div>

              {/* Verbatim Ground Truth Quote */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Original Ground-Truth Instrument Text</span>
                </div>
                <blockquote className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed italic max-h-32 overflow-y-auto">
                  "{activeNode.verbatimQuote}"
                </blockquote>
              </div>

              {/* Hidden Pitfalls */}
              {activeNode.hiddenPitfalls.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Hidden Traps & Blast Radius</span>
                  </div>
                  <ul className="space-y-1">
                    {activeNode.hiddenPitfalls.map((pitfall, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-300 flex items-start gap-2 bg-rose-500/5 p-2 rounded-lg border border-rose-500/20">
                        <span className="text-rose-400 font-bold shrink-0">✕</span>
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tactical Counter-Proposal / Redline */}
              {activeNode.proposedRedline && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recommended Redline / Safe Harbor</span>
                  </div>
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300/90 leading-relaxed font-mono">
                    {activeNode.proposedRedline}
                  </div>
                </div>
              )}

              {/* Navigation Action */}
              {onNavigateToClause && (
                <button
                  type="button"
                  onClick={() => onNavigateToClause(activeNode.clauseId)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <span>Inspect in Dual-Pane Ground-Truth Viewer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 text-slate-400">
              <Crosshair className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-white">Select Any Node</div>
              <p className="text-xs">
                Click any point on the D3 Risk-Reward Matrix to view the verbatim citation, plain English meaning, and tactical redline.
              </p>
            </div>
          )}

          {/* Aggregate Risk Advisory Box */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Risk-Reward Audit Summary</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This instrument features <strong className="text-rose-400">{quadrantCounts.TOXIC_PITFALL} Toxic Pitfalls</strong> requiring aggressive modification and <strong className="text-emerald-400">{quadrantCounts.GOLDEN_COVENANT} Golden Covenants</strong> that protect your operational equity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
