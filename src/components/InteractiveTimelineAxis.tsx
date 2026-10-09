import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Move,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { TimelineEvent, ArtifactType } from '../types/forensics';

export interface InteractiveTimelineAxisProps {
  events: TimelineEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  selectedType: string;
  selectedSeverity: string;
  selectedPhase: string;
  onSelectPhase?: (phase: string) => void;
  /** Active brushed/zoomed time window callback to sync with parent */
  onTimeWindowChange?: (window: [Date, Date] | null) => void;
  /** Whether the parent table is currently filtered by the active time window */
  isTableSynced?: boolean;
  /** Callback to toggle table synchronization */
  onToggleTableSync?: (synced: boolean) => void;
}

interface PhaseDefinition {
  id: string;
  name: string;
  shortName: string;
  startTime: Date;
  endTime: Date;
  color: string;
  description: string;
}

export const INCIDENT_PHASES: PhaseDefinition[] = [
  {
    id: 'p1',
    name: 'Fase 1: Fuerza Bruta & Acceso RDP',
    shortName: 'Fase 1: Acceso RDP',
    startTime: new Date('2026-03-14T02:01:00Z'),
    endTime: new Date('2026-03-14T02:05:30Z'),
    color: '#58a6ff',
    description: '02:01 - 02:05 UTC | Brute Force RDP y asignación de privilegios (4624/4672)'
  },
  {
    id: 'p2',
    name: 'Fase 2: Persistencia & Inyección LSASS',
    shortName: 'Fase 2: RAM & LSASS',
    startTime: new Date('2026-03-14T02:08:00Z'),
    endTime: new Date('2026-03-14T02:10:00Z'),
    color: '#bc8cff',
    description: '02:08 - 02:10 UTC | Registro Run, ejecución svc_update.exe e inyección en lsass.exe'
  },
  {
    id: 'p3',
    name: 'Fase 3: Beaconing C2 & Túnel DNS',
    shortName: 'Fase 3: Red & C2',
    startTime: new Date('2026-03-14T02:10:00Z'),
    endTime: new Date('2026-03-14T02:15:30Z'),
    color: '#f0883e',
    description: '02:10 - 02:15 UTC | Conexiones periódicas a 203.0.113.44:4444 y consultas base32'
  },
  {
    id: 'p4',
    name: 'Fase 4: Exfiltración S3 & Anti-Forense',
    shortName: 'Fase 4: Cloud & Evasión',
    startTime: new Date('2026-03-14T02:18:00Z'),
    endTime: new Date('2026-03-14T02:32:00Z'),
    color: '#f85149',
    description: '02:18 - 02:32 UTC | GetObject S3, CreateAccessKey y vaciado del log (1102)'
  }
];

const ARTIFACT_LANES: { type: ArtifactType; label: string; color: string }[] = [
  { type: 'EVTX', label: 'EVTX / Logs', color: '#58a6ff' },
  { type: 'Registro', label: 'Registro Windows', color: '#bc8cff' },
  { type: 'Prefetch', label: 'Prefetch / Ejecución', color: '#d29922' },
  { type: 'MFT', label: '$MFT / Disco', color: '#3fb950' },
  { type: 'Red', label: 'Red & C2', color: '#f0883e' },
  { type: 'Cloud', label: 'AWS CloudTrail', color: '#f778ba' }
];

export const InteractiveTimelineAxis: React.FC<InteractiveTimelineAxisProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  selectedType,
  selectedSeverity,
  selectedPhase,
  onSelectPhase,
  onTimeWindowChange,
  isTableSynced = false,
  onToggleTableSync
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(900);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [interactionMode, setInteractionMode] = useState<'pan-zoom' | 'brush'>('pan-zoom');

  // Time boundary of entire incident: 02:00 to 02:32:30 UTC on 2026-03-14
  const defaultDomain = useMemo<[Date, Date]>(() => {
    return [
      new Date('2026-03-14T02:00:00Z'),
      new Date('2026-03-14T02:32:30Z')
    ];
  }, []);

  const [currentDomain, setCurrentDomain] = useState<[Date, Date]>(defaultDomain);

  // Parse time helper
  const parseTime = useCallback((ts: string): Date => {
    return new Date(ts.replace(' ', 'T') + 'Z');
  }, []);

  // Update container width on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Synchronize phase filter from external selector with timeline domain
  useEffect(() => {
    if (selectedPhase === 'all') {
      setCurrentDomain(defaultDomain);
      if (onTimeWindowChange) onTimeWindowChange(null);
    } else {
      const p = INCIDENT_PHASES.find((item) => item.id === selectedPhase);
      if (p) {
        const padStart = new Date(p.startTime.getTime() - 40 * 1000);
        const padEnd = new Date(p.endTime.getTime() + 40 * 1000);
        const newDomain: [Date, Date] = [padStart, padEnd];
        setCurrentDomain(newDomain);
        if (onTimeWindowChange) onTimeWindowChange(newDomain);
      }
    }
  }, [selectedPhase, defaultDomain, onTimeWindowChange]);

  // Layout dimensions
  const svgTotalHeight = 315;
  const margin = { top: 26, right: 28, bottom: 20, left: 125 };
  const innerWidth = Math.max(containerWidth - margin.left - margin.right, 300);

  // Focus Area (Top, Detailed)
  const focusHeight = 175;
  // Context Area (Bottom, Navigator / Brush)
  const contextMarginTop = 238;
  const contextHeight = 44;

  // Static Context Scale (Always spans 100% of incident period)
  const xScaleContext = useMemo(() => {
    return d3.scaleTime().domain(defaultDomain).range([0, innerWidth]);
  }, [defaultDomain, innerWidth]);

  // Dynamic Focus Scale
  const xScaleFocus = useMemo(() => {
    return d3.scaleTime().domain(currentDomain).range([0, innerWidth]);
  }, [currentDomain, innerWidth]);

  // Y Scale for artifact lanes in focus chart
  const yScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .domain(ARTIFACT_LANES.map((l) => l.type))
      .range([0, focusHeight])
      .padding(0.18);
  }, [focusHeight]);

  // Detect whether current domain is zoomed or full
  const isFullIncidentView = useMemo(() => {
    const diffStart = Math.abs(currentDomain[0].getTime() - defaultDomain[0].getTime());
    const diffEnd = Math.abs(currentDomain[1].getTime() - defaultDomain[1].getTime());
    return diffStart < 4000 && diffEnd < 4000;
  }, [currentDomain, defaultDomain]);

  // Count events currently inside focus domain
  const eventsInCurrentWindow = useMemo(() => {
    return events.filter((e) => {
      const t = parseTime(e.timestamp).getTime();
      return t >= currentDomain[0].getTime() && t <= currentDomain[1].getTime();
    });
  }, [events, currentDomain, parseTime]);

  // Duration in mm:ss of current view
  const currentDurationFormatted = useMemo(() => {
    const totalSeconds = Math.max(0, Math.round((currentDomain[1].getTime() - currentDomain[0].getTime()) / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }, [currentDomain]);

  // Render D3 Visualization with Focus + Context Brushing and Zooming
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Definitions (Clip Paths, Gradients)
    const defs = svg.append('defs');

    // Clip path for focus area (events & lanes)
    defs
      .append('clipPath')
      .attr('id', 'focus-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', focusHeight);

    // Clip path for context area
    defs
      .append('clipPath')
      .attr('id', 'context-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', contextHeight);

    // ==========================================
    // 1. FOCUS CONTAINER (Upper Detail Area)
    // ==========================================
    const focusG = svg
      .append('g')
      .attr('class', 'focus-area')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Background rect for focus canvas to receive zoom and drag events
    const focusBg = focusG
      .append('rect')
      .attr('class', 'focus-background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', focusHeight)
      .attr('fill', '#0d1117')
      .attr('fill-opacity', 0.6)
      .attr('stroke', '#30363d')
      .attr('stroke-width', 1)
      .attr('rx', 6);

    // Focus Incident Phase Background Zones
    const focusPhasesG = focusG
      .append('g')
      .attr('class', 'focus-phases')
      .attr('clip-path', 'url(#focus-clip)');

    INCIDENT_PHASES.forEach((phase) => {
      const x1 = Math.max(0, xScaleFocus(phase.startTime));
      const x2 = Math.min(innerWidth, xScaleFocus(phase.endTime));
      const w = Math.max(0, x2 - x1);

      if (w > 0) {
        focusPhasesG
          .append('rect')
          .attr('x', x1)
          .attr('y', 0)
          .attr('width', w)
          .attr('height', focusHeight)
          .attr('fill', phase.color)
          .attr('fill-opacity', selectedPhase === phase.id ? 0.16 : 0.05)
          .attr('stroke', phase.color)
          .attr('stroke-opacity', selectedPhase === phase.id ? 0.45 : 0.12)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');

        if (w > 50) {
          focusPhasesG
            .append('text')
            .attr('x', x1 + 5)
            .attr('y', 12)
            .attr('fill', phase.color)
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('opacity', 0.85)
            .text(phase.shortName);
        }
      }
    });

    // Artifact Lanes Horizontal Grid & Labels
    const laneHeight = yScale.bandwidth();
    ARTIFACT_LANES.forEach((lane) => {
      const yPos = (yScale(lane.type) || 0) + laneHeight / 2;

      // Lane Guide Line
      focusG
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yPos)
        .attr('y2', yPos)
        .attr('stroke', '#30363d')
        .attr('stroke-opacity', 0.45)
        .attr('stroke-dasharray', '3,3');

      // Left Lane Indicator & Label
      const labelG = focusG
        .append('g')
        .attr('transform', `translate(-10, ${yPos})`);

      labelG
        .append('circle')
        .attr('cx', -95)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', lane.color);

      labelG
        .append('text')
        .attr('x', -86)
        .attr('y', 3.5)
        .attr('text-anchor', 'start')
        .attr('font-size', '10px')
        .attr('font-weight', selectedType === lane.type ? '700' : '500')
        .attr('fill', selectedType === lane.type ? lane.color : '#8b949e')
        .text(lane.label);
    });

    // Focus Time Axis (Bottom of focus chart)
    const focusTimeAxis = d3
      .axisBottom(xScaleFocus)
      .ticks(Math.max(5, Math.floor(innerWidth / 100)))
      .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date))
      .tickSizeOuter(0);

    const focusAxisG = focusG
      .append('g')
      .attr('class', 'focus-x-axis')
      .attr('transform', `translate(0, ${focusHeight})`)
      .call(focusTimeAxis);

    focusAxisG.select('.domain').attr('stroke', '#30363d').attr('stroke-width', 1.2);
    focusAxisG.selectAll('.tick line').attr('stroke', '#30363d');
    focusAxisG
      .selectAll('.tick text')
      .attr('fill', '#8b949e')
      .attr('font-size', '9.5px')
      .attr('font-family', 'monospace');

    // Event Nodes Container (clipped to focus area)
    const nodesGroup = focusG
      .append('g')
      .attr('class', 'focus-event-nodes')
      .attr('clip-path', 'url(#focus-clip)');

    events.forEach((evt) => {
      const evtTime = parseTime(evt.timestamp);
      const cx = xScaleFocus(evtTime);
      const cy = (yScale(evt.artifactType) || 0) + laneHeight / 2;
      const isSelected = selectedEventId === evt.id;

      const artifactDef = ARTIFACT_LANES.find((a) => a.type === evt.artifactType);
      const nodeColor = artifactDef?.color || '#58a6ff';

      const isSeverityMatch =
        selectedSeverity === 'all' ||
        (selectedSeverity === 'critical' && evt.severity === 'critical') ||
        (selectedSeverity === 'high' && (evt.severity === 'high' || evt.severity === 'critical')) ||
        (selectedSeverity === 'medium' && evt.severity === 'medium');

      const isTypeMatch = selectedType === 'all' || selectedType === evt.artifactType;
      const isDimmed = !isSeverityMatch || !isTypeMatch;

      const nodeG = nodesGroup
        .append('g')
        .attr('class', `node-${evt.id}`)
        .attr('transform', `translate(${cx}, ${cy})`)
        .attr('cursor', 'pointer')
        .attr('opacity', isDimmed ? 0.3 : 1)
        .on('mouseenter', (event: MouseEvent) => {
          setHoveredEvent(evt);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mousemove', (event: MouseEvent) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mouseleave', () => {
          setHoveredEvent(null);
          setTooltipPos(null);
        })
        .on('click', () => {
          onSelectEvent(evt.id);
        });

      // Animated / glowing pulse ring for currently selected event
      if (isSelected) {
        nodeG
          .append('circle')
          .attr('r', 13)
          .attr('fill', nodeColor)
          .attr('fill-opacity', 0.25)
          .attr('stroke', nodeColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2');

        nodeG
          .append('circle')
          .attr('r', 8.5)
          .attr('fill', '#f0883e')
          .attr('fill-opacity', 0.45);
      }

      // Main event dot
      const circleRadius = isSelected ? 6.5 : evt.severity === 'critical' ? 5.5 : 4.5;
      nodeG
        .append('circle')
        .attr('r', circleRadius)
        .attr('fill', evt.severity === 'critical' ? '#f85149' : nodeColor)
        .attr('stroke', isSelected ? '#ffffff' : '#0d1117')
        .attr('stroke-width', isSelected ? 2 : 1.5);

      // Critical severity outer indicator ring
      if (evt.severity === 'critical' && !isSelected) {
        nodeG
          .append('circle')
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', '#f85149')
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', 0.75);
      }

      // Timestamp label below selected node
      if (isSelected) {
        nodeG
          .append('text')
          .attr('y', 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .attr('fill', '#58a6ff')
          .text(evt.timestamp.split(' ')[1]);
      }
    });

    // ==========================================
    // 2. CONTEXT CONTAINER (Bottom Mini-Map & Brush)
    // ==========================================
    const contextG = svg
      .append('g')
      .attr('class', 'context-area')
      .attr('transform', `translate(${margin.left}, ${contextMarginTop})`);

    // Context Background
    contextG
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', contextHeight)
      .attr('fill', '#090d13')
      .attr('stroke', '#30363d')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Left Context Title Label
    const contextLabelG = contextG
      .append('g')
      .attr('transform', `translate(-10, ${contextHeight / 2})`);

    contextLabelG
      .append('text')
      .attr('x', -8)
      .attr('y', -3)
      .attr('text-anchor', 'end')
      .attr('font-size', '9.5px')
      .attr('font-weight', '600')
      .attr('fill', '#8b949e')
      .text('Navegador Global');

    contextLabelG
      .append('text')
      .attr('x', -8)
      .attr('y', 9)
      .attr('text-anchor', 'end')
      .attr('font-size', '8.5px')
      .attr('fill', '#58a6ff')
      .text('(Arrastra / Brush)');

    // Context Phase Background Bands
    const contextPhasesG = contextG
      .append('g')
      .attr('class', 'context-phases')
      .attr('clip-path', 'url(#context-clip)');

    INCIDENT_PHASES.forEach((phase) => {
      const x1 = Math.max(0, xScaleContext(phase.startTime));
      const x2 = Math.min(innerWidth, xScaleContext(phase.endTime));
      const w = Math.max(0, x2 - x1);

      if (w > 0) {
        contextPhasesG
          .append('rect')
          .attr('x', x1)
          .attr('y', 0)
          .attr('width', w)
          .attr('height', contextHeight)
          .attr('fill', phase.color)
          .attr('fill-opacity', 0.12)
          .attr('stroke', phase.color)
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 1);

        if (w > 40) {
          contextPhasesG
            .append('text')
            .attr('x', x1 + 3)
            .attr('y', 9)
            .attr('fill', phase.color)
            .attr('font-size', '8px')
            .attr('font-weight', '700')
            .attr('opacity', 0.75)
            .text(phase.shortName.split(':')[0]);
        }
      }
    });

    // Context Mini Event Markers (Density indicators across full incident)
    const contextEventsG = contextG
      .append('g')
      .attr('class', 'context-events')
      .attr('clip-path', 'url(#context-clip)');

    events.forEach((evt) => {
      const evtTime = parseTime(evt.timestamp);
      const cx = xScaleContext(evtTime);
      const isCritical = evt.severity === 'critical';
      const isSelected = selectedEventId === evt.id;

      contextEventsG
        .append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 12)
        .attr('y2', contextHeight - 12)
        .attr('stroke', isSelected ? '#58a6ff' : isCritical ? '#f85149' : '#d29922')
        .attr('stroke-width', isSelected ? 2.5 : isCritical ? 2 : 1.2)
        .attr('stroke-opacity', isSelected ? 1 : isCritical ? 0.9 : 0.65);
    });

    // Context Time Axis (Bottom)
    const contextTimeAxis = d3
      .axisBottom(xScaleContext)
      .ticks(Math.max(4, Math.floor(innerWidth / 120)))
      .tickFormat((d) => d3.timeFormat('%H:%M')(d as Date))
      .tickSizeOuter(0);

    const contextAxisG = contextG
      .append('g')
      .attr('class', 'context-x-axis')
      .attr('transform', `translate(0, ${contextHeight})`)
      .call(contextTimeAxis);

    contextAxisG.select('.domain').attr('stroke', '#30363d').attr('stroke-width', 1);
    contextAxisG.selectAll('.tick line').attr('stroke', '#30363d');
    contextAxisG
      .selectAll('.tick text')
      .attr('fill', '#6e7681')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // ==========================================
    // 3. D3 BRUSH ON CONTEXT NAVIGATOR
    // ==========================================
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, contextHeight]
      ])
      .on('brush end', (event: d3.D3BrushEvent<unknown>) => {
        // Guard against infinite event recursion
        if (!event.sourceEvent) return;

        const selection = event.selection as [number, number] | null;
        if (selection) {
          const [s0, s1] = selection;
          // Ensure valid span
          if (s1 - s0 >= 4) {
            const date0 = xScaleContext.invert(s0);
            const date1 = xScaleContext.invert(s1);
            // Minimum window length 12 seconds
            if (date1.getTime() - date0.getTime() >= 12000) {
              const newDomain: [Date, Date] = [date0, date1];
              setCurrentDomain(newDomain);
              if (onTimeWindowChange) {
                onTimeWindowChange(newDomain);
              }
            }
          }
        } else if (event.type === 'end') {
          // Empty selection clicked -> reset to entire incident
          setCurrentDomain(defaultDomain);
          if (onTimeWindowChange) {
            onTimeWindowChange(null);
          }
        }
      });

    const brushG = contextG.append('g').attr('class', 'brush').call(brush);

    // Style the D3 brush elements
    brushG
      .select('.selection')
      .attr('fill', '#f0883e')
      .attr('fill-opacity', 0.22)
      .attr('stroke', '#f0883e')
      .attr('stroke-width', 1.5)
      .attr('rx', 3);

    // Set initial brush position according to currentDomain
    if (!isFullIncidentView) {
      const s0 = Math.max(0, xScaleContext(currentDomain[0]));
      const s1 = Math.min(innerWidth, xScaleContext(currentDomain[1]));
      brushG.call(brush.move, [s0, s1]);
    } else {
      // Full view: cover entire context width or subtle overlay
      brushG.call(brush.move, [0, innerWidth]);
    }

    // ==========================================
    // 4. D3 ZOOM & PAN BEHAVIOR ON FOCUS AREA
    // ==========================================
    const zoomBehavior = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 25])
      .translateExtent([
        [0, 0],
        [innerWidth, focusHeight]
      ])
      .extent([
        [0, 0],
        [innerWidth, focusHeight]
      ])
      .on('zoom', (event: d3.D3ZoomEvent<SVGRectElement, unknown>) => {
        if (!event.sourceEvent) return;

        const newX = event.transform.rescaleX(xScaleContext);
        const [d0, d1] = newX.domain() as [Date, Date];

        // Bounds clamping
        const minDate = new Date(defaultDomain[0].getTime() - 20000);
        const maxDate = new Date(defaultDomain[1].getTime() + 20000);

        const clamped0 = d0 < minDate ? minDate : d0;
        const clamped1 = d1 > maxDate ? maxDate : d1;

        if (clamped1.getTime() - clamped0.getTime() >= 12000) {
          const newDomain: [Date, Date] = [clamped0, clamped1];
          setCurrentDomain(newDomain);
          if (onTimeWindowChange) {
            onTimeWindowChange(newDomain);
          }

          // Synchronize the context brush window position
          const s0 = Math.max(0, xScaleContext(clamped0));
          const s1 = Math.min(innerWidth, xScaleContext(clamped1));
          brushG.call(brush.move, [s0, s1]);
        }
      });

    // Double-click to reset zoom
    focusBg.on('dblclick', () => {
      setCurrentDomain(defaultDomain);
      if (onTimeWindowChange) onTimeWindowChange(null);
      brushG.call(brush.move, [0, innerWidth]);
    });

    if (interactionMode === 'pan-zoom') {
      focusBg.call(zoomBehavior);
      focusBg.attr('cursor', 'grab');
    } else {
      // In Brush mode directly on focus canvas:
      // Allow drag to create a brush window on the focus area
      const focusBrush = d3
        .brushX()
        .extent([
          [0, 0],
          [innerWidth, focusHeight]
        ])
        .on('end', (event: d3.D3BrushEvent<unknown>) => {
          if (!event.sourceEvent) return;
          const sel = event.selection as [number, number] | null;
          if (sel && sel[1] - sel[0] > 10) {
            const date0 = xScaleFocus.invert(sel[0]);
            const date1 = xScaleFocus.invert(sel[1]);
            const newDomain: [Date, Date] = [date0, date1];
            setCurrentDomain(newDomain);
            if (onTimeWindowChange) {
              onTimeWindowChange(newDomain);
            }
            // Clear the temporary focus brush box and sync context
            focusG.select<SVGGElement>('.focus-brush').call(focusBrush.move, null);
            brushG.call(brush.move, [
              Math.max(0, xScaleContext(date0)),
              Math.min(innerWidth, xScaleContext(date1))
            ]);
            // Return to pan-zoom mode after drawing a box
            setInteractionMode('pan-zoom');
          }
        });

      focusG.append('g').attr('class', 'focus-brush').call(focusBrush);
      focusG.select('.focus-brush .selection').attr('fill', '#58a6ff').attr('fill-opacity', 0.25).attr('stroke', '#58a6ff');
    }
  }, [
    innerWidth,
    focusHeight,
    contextHeight,
    contextMarginTop,
    margin,
    xScaleFocus,
    xScaleContext,
    yScale,
    events,
    selectedEventId,
    selectedType,
    selectedSeverity,
    selectedPhase,
    defaultDomain,
    currentDomain,
    isFullIncidentView,
    interactionMode,
    parseTime,
    onSelectEvent,
    onTimeWindowChange
  ]);

  // Zoom preset helper
  const handleZoomPreset = (phaseId: string) => {
    if (phaseId === 'all') {
      setCurrentDomain(defaultDomain);
      if (onSelectPhase) onSelectPhase('all');
      if (onTimeWindowChange) onTimeWindowChange(null);
    } else {
      const p = INCIDENT_PHASES.find((item) => item.id === phaseId);
      if (p) {
        const padStart = new Date(p.startTime.getTime() - 40 * 1000);
        const padEnd = new Date(p.endTime.getTime() + 40 * 1000);
        const newDomain: [Date, Date] = [padStart, padEnd];
        setCurrentDomain(newDomain);
        if (onSelectPhase) onSelectPhase(phaseId);
        if (onTimeWindowChange) onTimeWindowChange(newDomain);
      }
    }
  };

  // Step zoom in/out
  const handleStepZoom = (zoomIn: boolean) => {
    const span = currentDomain[1].getTime() - currentDomain[0].getTime();
    const factor = zoomIn ? 0.65 : 1.45;
    const newSpan = span * factor;
    const center = (currentDomain[0].getTime() + currentDomain[1].getTime()) / 2;
    const newStart = new Date(center - newSpan / 2);
    const newEnd = new Date(center + newSpan / 2);

    const minStart = new Date('2026-03-14T01:58:30Z');
    const maxEnd = new Date('2026-03-14T02:34:00Z');

    const clampedStart = newStart < minStart ? minStart : newStart;
    const clampedEnd = newEnd > maxEnd ? maxEnd : newEnd;
    const newDomain: [Date, Date] = [clampedStart, clampedEnd];
    setCurrentDomain(newDomain);
    if (onTimeWindowChange) onTimeWindowChange(newDomain);
  };

  // Pan left or right by 25% of current span
  const handleStepPan = (direction: 'left' | 'right') => {
    const span = currentDomain[1].getTime() - currentDomain[0].getTime();
    const shift = (span * 0.25) * (direction === 'left' ? -1 : 1);
    const newStart = new Date(currentDomain[0].getTime() + shift);
    const newEnd = new Date(currentDomain[1].getTime() + shift);

    const minStart = new Date('2026-03-14T01:58:30Z');
    const maxEnd = new Date('2026-03-14T02:34:00Z');

    if (newStart < minStart || newEnd > maxEnd) return;
    const newDomain: [Date, Date] = [newStart, newEnd];
    setCurrentDomain(newDomain);
    if (onTimeWindowChange) onTimeWindowChange(newDomain);
  };

  return (
    <div className="rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] p-3.5 transition-colors shadow-lg">
      {/* Top Header Bar with controls and Active Window Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#30363d]/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#f0883e]/15 border border-[#f0883e]/30 text-[#f0883e]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]">
                Visualizador Temporal Forense (D3.js Zoom & Brushing)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d1117] border border-[#30363d] text-[#58a6ff] font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
                2026-03-14 UTC
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              Arrastra el pincel en el navegador inferior o usa la rueda del ratón para ampliar cualquier ventana de tiempo.
            </p>
          </div>
        </div>

        {/* Active Window Badge & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Window Indicator */}
          <div className="px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center gap-2 text-xs">
            <span className="text-[#8b949e] text-[11px]">Ventana activa:</span>
            <span className="font-mono text-[#f0883e] font-bold text-[11px]">
              {d3.timeFormat('%H:%M:%S')(currentDomain[0])} – {d3.timeFormat('%H:%M:%S')(currentDomain[1])}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#e6edf3] font-mono">
              {currentDurationFormatted}
            </span>
            <span className="text-[10px] text-[#3fb950] font-semibold">
              ({eventsInCurrentWindow.length} eventos)
            </span>
          </div>

          {/* Table Sync Toggle Button */}
          {onToggleTableSync && (
            <button
              onClick={() => onToggleTableSync(!isTableSynced)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isTableSynced
                  ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950]'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#8b949e]'
              }`}
              title="Filtrar la tabla inferior para mostrar únicamente los eventos dentro de la ventana de tiempo enfocada"
            >
              <Filter className="w-3 h-3" />
              <span>Sincronizar tabla</span>
              {isTableSynced && <CheckCircle2 className="w-3 h-3 text-[#3fb950]" />}
            </button>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors ml-auto sm:ml-0"
            title={isCollapsed ? 'Expandir visualizador' : 'Colapsar visualizador'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Control Bar: Mode Toggle + Phase Presets + Zoom Steps */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 text-xs">
          {/* Interaction Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setInteractionMode('pan-zoom')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-medium transition-colors ${
                interactionMode === 'pan-zoom'
                  ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title="Modo Pan & Zoom: rueda del ratón para ampliar y arrastre horizontal para desplazarse"
            >
              <Move className="w-3 h-3" />
              <span>Pan & Zoom</span>
            </button>
            <button
              onClick={() => setInteractionMode('brush')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-medium transition-colors ${
                interactionMode === 'brush'
                  ? 'bg-[#21262d] text-[#f0883e] border border-[#f0883e]/40 shadow-sm'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title="Modo Pincel (Brush): arrastra un rectángulo directamente en el gráfico principal para enfocar esa sección"
            >
              <Crosshair className="w-3 h-3" />
              <span>Pincel directo</span>
            </button>
          </div>

          {/* Incident Phase Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d] text-[10px]">
            <button
              onClick={() => handleZoomPreset('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                isFullIncidentView
                  ? 'bg-[#f0883e] text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
              title="Restablecer al incidente completo (02:00 - 02:32 UTC)"
            >
              Todo el incidente
            </button>
            {INCIDENT_PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleZoomPreset(p.id)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedPhase === p.id && !isFullIncidentView
                    ? 'bg-[#f0883e] text-black font-bold shadow-sm'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                }`}
                title={p.description}
              >
                {p.shortName.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Steppers: Pan Left/Right, Zoom In/Out, Reset */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => handleStepPan('left')}
              className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Desplazar ventana a la izquierda (◀)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleStepPan('right')}
              className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Desplazar ventana a la derecha (▶)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-[#30363d] mx-0.5" />
            <button
              onClick={() => handleStepZoom(true)}
              className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Acercar tiempo (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleStepZoom(false)}
              className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Alejar tiempo (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoomPreset('all')}
              className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Restablecer vista completa de 32 minutos (doble clic en el gráfico)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main D3 SVG Canvas Area */}
      {!isCollapsed && (
        <div ref={containerRef} className="relative mt-1 select-none overflow-hidden">
          <svg
            ref={svgRef}
            width={containerWidth}
            height={svgTotalHeight}
            className="w-full block overflow-visible"
          />

          {/* Interactive Hover Tooltip */}
          {hoveredEvent && tooltipPos && (
            <div
              className="absolute z-30 pointer-events-none p-3 rounded-xl bg-[#0d1117]/95 border border-[#f0883e]/60 shadow-2xl backdrop-blur-md text-xs max-w-xs transition-all animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: Math.min(tooltipPos.x + 14, containerWidth - 290),
                top: Math.max(tooltipPos.y - 130, 8)
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-[#58a6ff] font-bold text-[11px] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
                  {hoveredEvent.timestamp} UTC
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#30363d] text-[#e6edf3]">
                  {hoveredEvent.artifactType}
                </span>
              </div>
              <div className="font-semibold text-[#e6edf3] text-xs mb-1.5 line-clamp-2">
                {hoveredEvent.summary}
              </div>
              <div className="text-[10px] text-[#8b949e] mb-1.5 flex items-center justify-between">
                <span>Herramienta: <strong className="text-[#e6edf3] font-mono">{hoveredEvent.sourceTool}</strong></span>
                <span className={`capitalize font-bold text-[10px] ${
                  hoveredEvent.severity === 'critical' ? 'text-red-400' : hoveredEvent.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                }`}>
                  {hoveredEvent.severity}
                </span>
              </div>
              {hoveredEvent.mitre && (
                <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#d29922] border border-[#30363d]/60 mb-1.5 inline-block">
                  {hoveredEvent.mitre.id} &middot; {hoveredEvent.mitre.name}
                </div>
              )}
              <div className="pt-1.5 border-t border-[#30363d]/60 text-[10px] text-[#f0883e] flex items-center gap-1">
                <span>Haz clic para seleccionar e inspeccionar</span>
              </div>
            </div>
          )}

          {/* Legend and Navigation Guidance Footer */}
          <div className="mt-2 pt-2 border-t border-[#30363d]/40 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8b949e]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-[#e6edf3]">Carriles por Artefacto:</span>
              {ARTIFACT_LANES.map((lane) => (
                <div key={lane.type} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: lane.color }}
                  />
                  <span>{lane.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f85149] ring-2 ring-[#f85149]/40" />
                <span>Evento Crítico</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f0883e] ring-2 ring-[#f0883e]/60 animate-pulse" />
                <span>Seleccionado</span>
              </div>
              <div className="text-[#6e7681] hidden md:inline">
                Arrastra el recuadro naranja en el navegador inferior para mover la ventana
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
