/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateMetaGraphData } from '../services/metaGraphGenerator';
import { MetaNode, MetaEdge, NodeType } from '../types';
import {
  ExternalLink,
  BookOpen,
  Users,
  Sliders,
  LayoutGrid,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';

interface SimulationNode extends MetaNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface SimulationLink {
  source: SimulationNode;
  target: SimulationNode;
  label: string;
}

interface PhysicsParams {
  spring: number;
  repulsion: number;
  damping: number;
}

const DEFAULT_PHYSICS: PhysicsParams = {
  spring: 0.02,
  repulsion: 650,
  damping: 0.68,
};

export const MetaGraphView: React.FC = () => {
  const {
    registeredPlugins,
    activePluginIds,
    selectedMetaNode,
    selectMetaNode,
  } = useAppStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);

  // Dynamic Physics Configuration State
  const [physics, setPhysics] = useState<PhysicsParams>(DEFAULT_PHYSICS);
  const [showPhysicsPanel, setShowPhysicsPanel] = useState<boolean>(false);
  const physicsRef = useRef<PhysicsParams>(DEFAULT_PHYSICS);

  const updatePhysics = (partial: Partial<PhysicsParams>) => {
    setPhysics((prev) => {
      const updated = { ...prev, ...partial };
      physicsRef.current = updated;
      alphaRef.current = 0.28; // Wake physics smoothly so new forces take effect
      return updated;
    });
  };

  // Zoom & Pan transformation state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimulationNode | null>(null);

  // Filter active plugins
  const activePlugins = useMemo(() => {
    return registeredPlugins.filter((p) => activePluginIds.includes(p.id));
  }, [registeredPlugins, activePluginIds]);

  // Generate Graph Data
  const rawGraphData = useMemo(() => {
    return generateMetaGraphData(activePlugins);
  }, [activePlugins]);

  // Simulation physics state
  const nodesRef = useRef<SimulationNode[]>([]);
  const linksRef = useRef<SimulationLink[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const alphaRef = useRef<number>(0.08);

  function getNodeRadius(group: NodeType): number {
    switch (group) {
      case NodeType.RESEARCH:
        return 18;
      case NodeType.WIDGET:
        return 16;
      case NodeType.ACOUSTIC_FEATURE:
        return 14;
      case NodeType.COHORT:
        return 13;
      default:
        return 12;
    }
  }

  // Smooth physics step with dynamic spring, repulsion, and damping
  function stepPhysics(
    nodes: SimulationNode[],
    links: SimulationLink[],
    alpha: number,
    draggedNode: SimulationNode | null
  ) {
    if (alpha <= 0.002) return;

    const len = nodes.length;
    const currentRepulsion = physicsRef.current.repulsion;
    const currentSpring = physicsRef.current.spring;
    const currentDamping = physicsRef.current.damping;

    // 1. Soft Coulomb Repulsion between nodes with clamped distance
    for (let i = 0; i < len; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < len; j++) {
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy;
        // Clamp minimum distance to prevent explosive repulsive spikes
        const dist = Math.max(45, Math.sqrt(distSq));

        if (dist < 340) {
          const repForce = (currentRepulsion / (dist * dist)) * alpha;
          const fx = (dx / dist) * repForce;
          const fy = (dy / dist) * repForce;

          if (n1 !== draggedNode) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (n2 !== draggedNode) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }
    }

    // 2. Hooke's Spring force along links
    const desiredDistance = 110;
    for (let k = 0; k < links.length; k++) {
      const link = links[k];
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const springForce = (dist - desiredDistance) * currentSpring * alpha;
      const fx = (dx / dist) * springForce;
      const fy = (dy / dist) * springForce;

      if (link.source !== draggedNode) {
        link.source.vx += fx;
        link.source.vy += fy;
      }
      if (link.target !== draggedNode) {
        link.target.vx -= fx;
        link.target.vy -= fy;
      }
    }

    // 3. Category Centroid Anchoring & Configured Velocity Damping
    for (let i = 0; i < len; i++) {
      const node = nodes[i];
      if (node === draggedNode) continue;

      // Pull gently toward group sectors to keep the 4 node types untangled
      let targetX = 0;
      let targetY = 0;
      if (node.group === NodeType.RESEARCH) {
        targetX = -130;
        targetY = -90;
      } else if (node.group === NodeType.WIDGET) {
        targetX = -130;
        targetY = 110;
      } else if (node.group === NodeType.COHORT) {
        targetX = 140;
        targetY = -90;
      } else if (node.group === NodeType.ACOUSTIC_FEATURE) {
        targetX = 140;
        targetY = 110;
      }

      node.vx += (targetX - node.x) * 0.0025 * alpha;
      node.vy += (targetY - node.y) * 0.0025 * alpha;

      // Velocity damping factor configured via physics state
      node.vx *= currentDamping;
      node.vy *= currentDamping;

      // Clamp maximum displacement per frame proportional to temperature
      const maxV = 7 * alpha;
      node.vx = Math.max(-maxV, Math.min(maxV, node.vx));
      node.vy = Math.max(-maxV, Math.min(maxV, node.vy));

      node.x += node.vx;
      node.y += node.vy;
    }
  }

  // Initialize or update simulation nodes & links with synchronous pre-warmup
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;

    // Center transform initially
    transformRef.current = { x: width / 2, y: height / 2, scale: 1 };

    const existingMap = new Map<string, SimulationNode>(
      nodesRef.current.map((n) => [n.id, n])
    );

    const simNodes: SimulationNode[] = rawGraphData.nodes.map((node) => {
      const existing = existingMap.get(node.id);
      if (existing) {
        return { ...node, x: existing.x, y: existing.y, vx: 0, vy: 0, radius: getNodeRadius(node.group) };
      }

      // Deterministic quadrant placement without random jumps
      const groupNodes = rawGraphData.nodes.filter((n) => n.group === node.group);
      const indexInGroup = groupNodes.findIndex((n) => n.id === node.id);
      const groupCount = Math.max(1, groupNodes.length);

      let baseAngle = 0;
      let baseRadius = 160;
      if (node.group === NodeType.RESEARCH) {
        baseAngle = Math.PI * 1.25; // Top-Left
        baseRadius = 140 + (indexInGroup % 3) * 35;
      } else if (node.group === NodeType.WIDGET) {
        baseAngle = Math.PI * 0.75; // Bottom-Left
        baseRadius = 150 + (indexInGroup % 3) * 35;
      } else if (node.group === NodeType.COHORT) {
        baseAngle = Math.PI * 1.75; // Top-Right
        baseRadius = 140 + (indexInGroup % 3) * 35;
      } else if (node.group === NodeType.ACOUSTIC_FEATURE) {
        baseAngle = Math.PI * 0.25; // Bottom-Right
        baseRadius = 150 + (indexInGroup % 3) * 35;
      }

      const angularSpread = ((indexInGroup - groupCount / 2) / groupCount) * 0.8;
      const angle = baseAngle + angularSpread;

      return {
        ...node,
        x: Math.cos(angle) * baseRadius,
        y: Math.sin(angle) * baseRadius,
        vx: 0,
        vy: 0,
        radius: getNodeRadius(node.group),
      };
    });

    const nodeLookup = new Map<string, SimulationNode>(simNodes.map((n) => [n.id, n]));

    const simLinks: SimulationLink[] = [];
    rawGraphData.links.forEach((l) => {
      const srcNode = nodeLookup.get(l.source);
      const tgtNode = nodeLookup.get(l.target);
      if (srcNode && tgtNode) {
        simLinks.push({
          source: srcNode,
          target: tgtNode,
          label: l.label,
        });
      }
    });

    // Synchronously pre-simulate 70 steps so the graph renders completely settled and calm on load!
    for (let step = 0; step < 70; step++) {
      const t = 1.0 - (step / 70);
      stepPhysics(simNodes, simLinks, t, null);
    }

    // Zero-out residual velocities
    simNodes.forEach((n) => {
      n.vx = 0;
      n.vy = 0;
    });

    nodesRef.current = simNodes;
    linksRef.current = simLinks;
    alphaRef.current = 0.08; // Gentle 10-frame micro-settle on load, then rests completely
  }, [rawGraphData]);

  // Physics Simulation Step & Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const runSimulation = () => {
      if (!isRunning) return;

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Only simulate physics when temperature is active, then settle and rest completely
      if (alphaRef.current > 0.003) {
        stepPhysics(nodes, links, alphaRef.current, draggedNodeRef.current);
        alphaRef.current *= 0.91; // Rapid, smooth cooldown
      }

      // Render Scene
      drawScene(ctx, canvas);

      animFrameRef.current = requestAnimationFrame(runSimulation);
    };

    animFrameRef.current = requestAnimationFrame(runSimulation);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [searchQuery, selectedGroupFilter, hoveredNode, selectedMetaNode]);

  // Main canvas draw routine
  const drawScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    const { x: tx, y: ty, scale } = transformRef.current;
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);

    const nodes = nodesRef.current;
    const links = linksRef.current;

    // Filter & search highlight check
    const isMatchingFilter = (n: SimulationNode) => {
      const matchesGroup =
        selectedGroupFilter === 'all' || n.group === selectedGroupFilter;
      const matchesSearch =
        !searchQuery ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.group.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    };

    // Draw Edges
    links.forEach((link) => {
      const isSrcMatch = isMatchingFilter(link.source);
      const isTgtMatch = isMatchingFilter(link.target);
      const isConnectedToSelected =
        selectedMetaNode &&
        (link.source.id === selectedMetaNode.id || link.target.id === selectedMetaNode.id);
      const isConnectedToHovered =
        hoveredNode &&
        (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id);

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);

      if (isConnectedToSelected || isConnectedToHovered) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.2 / scale;
      } else if (isSrcMatch && isTgtMatch) {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
        ctx.lineWidth = 1.2 / scale;
      } else {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
        ctx.lineWidth = 0.8 / scale;
      }
      ctx.stroke();

      // Render edge label when zoomed in or highlighted
      if (scale > 0.85 || isConnectedToSelected || isConnectedToHovered) {
        const midX = (link.source.x + link.target.x) / 2;
        const midY = (link.source.y + link.target.y) / 2;
        ctx.font = `${Math.max(8, 10 / scale)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = isConnectedToSelected ? '#38bdf8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(link.label, midX, midY - 3);
      }
    });

    // Draw Nodes
    const activeFocus = selectedMetaNode || hoveredNode;
    const neighborIds = new Set<string>();
    if (activeFocus) {
      links.forEach((l) => {
        if (l.source.id === activeFocus.id) neighborIds.add(l.target.id);
        else if (l.target.id === activeFocus.id) neighborIds.add(l.source.id);
      });
    }

    nodes.forEach((node) => {
      const isMatch = isMatchingFilter(node);
      const isSelected = selectedMetaNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isNeighbor = neighborIds.has(node.id);

      // Glow halo for selected / hovered / 1-hop Many:Many neighbors
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 7, 0, Math.PI * 2);
        ctx.fillStyle = node.color ? `${node.color}44` : 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
      } else if (isNeighbor) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isMatch ? (node.color || '#94a3b8') : 'rgba(51, 65, 85, 0.5)';
      ctx.fill();

      // Border ring
      ctx.lineWidth = isSelected ? 2.5 / scale : isNeighbor ? 2 / scale : 1.5 / scale;
      ctx.strokeStyle = isSelected ? '#ffffff' : isNeighbor ? '#38bdf8' : '#0f172a';
      ctx.stroke();

      // Group Glyph inside node
      ctx.font = `bold ${Math.max(8, 10 / scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const glyph =
        node.group === NodeType.RESEARCH
          ? 'R'
          : node.group === NodeType.WIDGET
          ? 'W'
          : node.group === NodeType.ACOUSTIC_FEATURE
          ? 'F'
          : 'C';
      ctx.fillText(glyph, node.x, node.y);

      // Label below node
      ctx.font = `${Math.max(9, 11 / scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = isMatch ? (isSelected || isNeighbor ? '#38bdf8' : '#f1f5f9') : '#64748b';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + node.radius + 4);
    });

    ctx.restore();
  };

  // Navigate to connected node from drawer Many:Many relation chips
  const handleSelectConnectedNode = (nodeId: string) => {
    const targetNode = rawGraphData.nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      selectMetaNode(targetNode);
      alphaRef.current = 0.12;
      const simNode = nodesRef.current.find((n) => n.id === nodeId);
      if (simNode && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        transformRef.current = {
          x: width / 2 - simNode.x * transformRef.current.scale,
          y: height / 2 - simNode.y * transformRef.current.scale,
          scale: transformRef.current.scale,
        };
      }
    }
  };

  // Convert client mouse coordinates to simulation world coordinates
  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const { x: tx, y: ty, scale } = transformRef.current;
    return {
      x: (screenX - tx) / scale,
      y: (screenY - ty) / scale,
    };
  };

  // Mouse / Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    // Check if clicked on a node
    const clickedNode = nodesRef.current.find((n) => {
      const dx = n.x - worldPos.x;
      const dy = n.y - worldPos.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      alphaRef.current = 0.25;
      selectMetaNode(clickedNode);
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = worldPos.x;
      draggedNodeRef.current.y = worldPos.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      alphaRef.current = 0.25;
      return;
    }

    if (isDraggingCanvasRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Check hover
    const hitNode = nodesRef.current.find((n) => {
      const dx = n.x - worldPos.x;
      const dy = n.y - worldPos.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });
    setHoveredNode(hitNode || null);
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
    alphaRef.current = 0.08;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x, y, scale } = transformRef.current;
    const newScale = Math.max(0.4, Math.min(2.5, scale * zoomFactor));

    // Zoom centered on cursor
    transformRef.current = {
      scale: newScale,
      x: mouseX - (mouseX - x) * (newScale / scale),
      y: mouseY - (mouseY - y) * (newScale / scale),
    };
  };

  const resetView = () => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;
    transformRef.current = { x: width / 2, y: height / 2, scale: 1 };
    alphaRef.current = 0.12;
  };

  const zoomIn = () => {
    transformRef.current.scale = Math.min(2.5, transformRef.current.scale * 1.25);
  };

  const zoomOut = () => {
    transformRef.current.scale = Math.max(0.4, transformRef.current.scale * 0.8);
  };

  // Resize canvas to match container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-140px)] min-h-[580px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex"
    >
      {/* Top Filter and Search Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[calc(100%-2rem)]">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes, authors, features..."
            className="pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-52 sm:w-64 backdrop-blur-sm"
          />
        </div>

        {/* Node Group Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 backdrop-blur-sm">
          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedGroupFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedGroupFilter(NodeType.RESEARCH)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedGroupFilter === NodeType.RESEARCH
                ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Research</span>
          </button>
          <button
            onClick={() => setSelectedGroupFilter(NodeType.COHORT)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedGroupFilter === NodeType.COHORT
                ? 'bg-blue-900/60 text-blue-200 border border-blue-500/40'
                : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Cohorts</span>
          </button>
          <button
            onClick={() => setSelectedGroupFilter(NodeType.ACOUSTIC_FEATURE)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedGroupFilter === NodeType.ACOUSTIC_FEATURE
                ? 'bg-amber-900/60 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Features</span>
          </button>
          <button
            onClick={() => setSelectedGroupFilter(NodeType.WIDGET)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedGroupFilter === NodeType.WIDGET
                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Widgets</span>
          </button>
        </div>

        {/* Physics Dynamics Toggle Button */}
        <button
          onClick={() => setShowPhysicsPanel(!showPhysicsPanel)}
          className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 backdrop-blur-sm shadow-sm ${
            showPhysicsPanel
              ? 'bg-cyan-950/90 border-cyan-500/70 text-cyan-300 ring-1 ring-cyan-500/30'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Configure simulation physics: Spring, Repulsion, Damping"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Physics Dynamics</span>
        </button>
      </div>

      {/* Floating Physics Controls Panel */}
      {showPhysicsPanel && (
        <div className="absolute top-16 left-4 z-30 w-80 sm:w-96 bg-slate-900/95 border border-slate-700/90 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Graph Physics Dynamics
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updatePhysics(DEFAULT_PHYSICS)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                title="Reset to Default Physics"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowPhysicsPanel(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                title="Close physics panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Spring Stiffness Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">Spring Tension</span>
              <span className="font-mono text-[11px] text-cyan-400">
                {physics.spring.toFixed(3)}
              </span>
            </div>
            {/* Toggles */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => updatePhysics({ spring: 0.010 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.spring <= 0.012
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Soft
              </button>
              <button
                onClick={() => updatePhysics({ spring: 0.020 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.spring > 0.012 && physics.spring < 0.030
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => updatePhysics({ spring: 0.038 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.spring >= 0.030
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stiff
              </button>
            </div>
            {/* Slider */}
            <input
              type="range"
              min="0.005"
              max="0.050"
              step="0.001"
              value={physics.spring}
              onChange={(e) => updatePhysics({ spring: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Repulsion Force Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">Node Repulsion</span>
              <span className="font-mono text-[11px] text-purple-400">
                {Math.round(physics.repulsion)}
              </span>
            </div>
            {/* Toggles */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => updatePhysics({ repulsion: 380 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.repulsion <= 450
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => updatePhysics({ repulsion: 650 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.repulsion > 450 && physics.repulsion < 950
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Balanced
              </button>
              <button
                onClick={() => updatePhysics({ repulsion: 1150 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.repulsion >= 950
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Wide
              </button>
            </div>
            {/* Slider */}
            <input
              type="range"
              min="200"
              max="1500"
              step="25"
              value={physics.repulsion}
              onChange={(e) => updatePhysics({ repulsion: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* Damping Factor Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">Velocity Damping (Friction)</span>
              <span className="font-mono text-[11px] text-emerald-400">
                {physics.damping.toFixed(2)}
              </span>
            </div>
            {/* Toggles */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => updatePhysics({ damping: 0.52 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.damping <= 0.58
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Firm (Quick)
              </button>
              <button
                onClick={() => updatePhysics({ damping: 0.68 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.damping > 0.58 && physics.damping < 0.76
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Calm
              </button>
              <button
                onClick={() => updatePhysics({ damping: 0.82 })}
                className={`py-1 rounded font-medium transition-colors ${
                  physics.damping >= 0.76
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fluid (Slow)
              </button>
            </div>
            {/* Slider */}
            <input
              type="range"
              min="0.45"
              max="0.88"
              step="0.01"
              value={physics.damping}
              onChange={(e) => updatePhysics({ damping: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Quick Presets Bar */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
            <span>PRESETS:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updatePhysics({ spring: 0.02, repulsion: 650, damping: 0.68 })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Default
              </button>
              <button
                onClick={() => updatePhysics({ spring: 0.015, repulsion: 1100, damping: 0.72 })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Spacious
              </button>
              <button
                onClick={() => updatePhysics({ spring: 0.035, repulsion: 380, damping: 0.58 })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Compact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Canvas Zoom Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 backdrop-blur-sm">
        <button
          onClick={zoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset Center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive 2D Graph Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Epistemic Side Panel Drawer when a node is selected */}
      {selectedMetaNode && (
        <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-slate-900/95 border-l border-slate-800 p-5 shadow-2xl overflow-y-auto z-30 animate-in slide-in-from-right duration-200 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedMetaNode.color || '#38bdf8' }}
                />
                <span className="text-xs uppercase tracking-wider font-mono text-slate-400">
                  {selectedMetaNode.group.replace('_', ' ')} Node
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-1">
                {selectedMetaNode.label}
              </h2>
            </div>
            <button
              onClick={() => selectMetaNode(null)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Node Specific Details */}
          {selectedMetaNode.group === NodeType.RESEARCH && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Full Paper Title
                </div>
                <div className="text-slate-200 font-medium text-sm leading-snug">
                  "{selectedMetaNode.metadata?.title}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-slate-400 text-[10px] font-mono">AUTHORS</div>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {Array.isArray(selectedMetaNode.metadata?.authors)
                      ? selectedMetaNode.metadata.authors.join(', ')
                      : selectedMetaNode.metadata?.authors}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-mono">YEAR &amp; JOURNAL</div>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {selectedMetaNode.metadata?.year} · {selectedMetaNode.metadata?.journal}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Persistent Identifier
                </div>
                <a
                  href={`https://doi.org/${selectedMetaNode.metadata?.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono text-xs underline"
                >
                  <span>doi:{selectedMetaNode.metadata?.doi}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Abstract &amp; Epistemic Argument
                </div>
                <p className="text-slate-300/90 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800 italic">
                  "{selectedMetaNode.metadata?.abstractSnippet}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Associated Analysis Plugin
                </div>
                <div className="text-slate-200 font-medium">
                  {selectedMetaNode.metadata?.pluginName}
                </div>
              </div>
            </div>
          )}

          {selectedMetaNode.group === NodeType.COHORT && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Cohort Category
                </div>
                <div className="text-slate-200 font-medium text-sm">
                  {selectedMetaNode.metadata?.cohortCategory}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-mono block">PRIMARY COHORT IDENTIFIER</span>
                  <span className="text-blue-300 font-semibold text-sm">
                    {selectedMetaNode.metadata?.gender || selectedMetaNode.metadata?.factor}
                  </span>
                </div>
                {selectedMetaNode.metadata?.intersectingFactors && (
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">INTERSECTING FACTORS</span>
                    <span className="text-slate-300">
                      {selectedMetaNode.metadata.intersectingFactors.join(' · ')}
                    </span>
                  </div>
                )}
                {selectedMetaNode.metadata?.genderScope && (
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">GENDER SCOPE</span>
                    <span className="text-slate-300">
                      {selectedMetaNode.metadata.genderScope.join(' · ')}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Grounded In Sociophonetic Study
                </div>
                <p className="text-slate-300 leading-snug">
                  "{selectedMetaNode.metadata?.researchedIn}"
                </p>
              </div>
            </div>
          )}

          {selectedMetaNode.group === NodeType.ACOUSTIC_FEATURE && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  Acoustic Feature
                </div>
                <div className="text-amber-400 font-semibold text-sm">
                  {selectedMetaNode.label}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-mono block">DIMENSION CATEGORY</span>
                  <span className="text-slate-200 font-medium">
                    {selectedMetaNode.metadata?.featureCategory || 'Acoustic Signal Processing Dimension'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                  <span>Visualized in {selectedMetaNode.metadata?.counts?.widgets || 0} widgets</span>
                  <span>Defined in {selectedMetaNode.metadata?.counts?.research || 0} papers</span>
                </div>
              </div>

              <div className="text-slate-400 leading-relaxed text-[11px]">
                Quantitatively extracted from real-time audio and mapped across intersecting demographic baselines.
              </div>
            </div>
          )}

          {selectedMetaNode.group === NodeType.WIDGET && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-slate-400 font-mono uppercase text-[10px] tracking-wider mb-1">
                  UI Widget
                </div>
                <div className="text-emerald-400 font-semibold text-sm">
                  {selectedMetaNode.label}
                </div>
              </div>

              <div className="text-slate-300 leading-relaxed">
                {selectedMetaNode.metadata?.description}
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] font-mono uppercase mb-1">
                  Visualized Features
                </div>
                <div className="text-slate-200 font-medium">
                  {selectedMetaNode.metadata?.features?.join(' · ')}
                </div>
              </div>
            </div>
          )}

          {/* Many:Many Relationship Network Explorer */}
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Many:Many Relationship Web
              </span>
              <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/50">
                Degree: {selectedMetaNode.connectedNodes?.length || 0}
              </span>
            </div>

            {/* Connected Acoustic Features */}
            {selectedMetaNode.metadata?.connectedFeatures && selectedMetaNode.metadata.connectedFeatures.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Acoustic Features ({selectedMetaNode.metadata.connectedFeatures.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMetaNode.metadata.connectedFeatures.map((feat: any) => (
                    <button
                      key={feat.id}
                      onClick={() => handleSelectConnectedNode(feat.id)}
                      className="px-2 py-1 rounded text-[11px] bg-amber-500/10 text-amber-200 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400 transition-colors flex items-center gap-1.5 text-left group"
                      title={`Navigate to ${feat.label} (${feat.relationship})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate max-w-[190px]">{feat.label}</span>
                      <span className="text-[9px] text-amber-400/70 font-mono">({feat.relationship})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Demographic Cohorts */}
            {selectedMetaNode.metadata?.connectedCohorts && selectedMetaNode.metadata.connectedCohorts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Demographic Cohorts ({selectedMetaNode.metadata.connectedCohorts.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMetaNode.metadata.connectedCohorts.map((cohort: any) => (
                    <button
                      key={cohort.id}
                      onClick={() => handleSelectConnectedNode(cohort.id)}
                      className="px-2 py-1 rounded text-[11px] bg-blue-500/10 text-blue-200 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400 transition-colors flex items-center gap-1.5 text-left group"
                      title={`Navigate to ${cohort.label} (${cohort.relationship})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="truncate max-w-[190px]">{cohort.label}</span>
                      <span className="text-[9px] text-blue-400/70 font-mono">({cohort.relationship})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Research Citations */}
            {selectedMetaNode.metadata?.connectedResearch && selectedMetaNode.metadata.connectedResearch.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Research Studies ({selectedMetaNode.metadata.connectedResearch.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMetaNode.metadata.connectedResearch.map((res: any) => (
                    <button
                      key={res.id}
                      onClick={() => handleSelectConnectedNode(res.id)}
                      className="px-2 py-1 rounded text-[11px] bg-purple-500/10 text-purple-200 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400 transition-colors flex items-center gap-1.5 text-left group"
                      title={`Navigate to ${res.label} (${res.relationship})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="truncate max-w-[190px]">{res.label}</span>
                      <span className="text-[9px] text-purple-400/70 font-mono">({res.relationship})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Connected UI Widgets */}
            {selectedMetaNode.metadata?.connectedWidgets && selectedMetaNode.metadata.connectedWidgets.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>UI Widgets ({selectedMetaNode.metadata.connectedWidgets.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMetaNode.metadata.connectedWidgets.map((w: any) => (
                    <button
                      key={w.id}
                      onClick={() => handleSelectConnectedNode(w.id)}
                      className="px-2 py-1 rounded text-[11px] bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 transition-colors flex items-center gap-1.5 text-left group"
                      title={`Navigate to ${w.label} (${w.relationship})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate max-w-[190px]">{w.label}</span>
                      <span className="text-[9px] text-emerald-400/70 font-mono">({w.relationship})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
