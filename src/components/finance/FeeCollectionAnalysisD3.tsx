import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Calendar,
  Filter,
  CheckCircle2,
  DollarSign,
  Download,
  Info
} from 'lucide-react';
import { triggerBrowserPrint } from '../../lib/pdf';

interface MonthlyFeeData {
  month: string;
  shortMonth: string;
  billed: number; // PKR
  collected: number; // PKR
  efficiency: number; // %
  isSeasonalDrop?: boolean;
  dropReason?: string;
}

const ACADEMIC_YEAR_2026: MonthlyFeeData[] = [
  { month: 'January 2026', shortMonth: 'Jan', billed: 420000, collected: 395000, efficiency: 94.0 },
  { month: 'February 2026', shortMonth: 'Feb', billed: 430000, collected: 408500, efficiency: 95.0 },
  { month: 'March 2026', shortMonth: 'Mar', billed: 450000, collected: 418500, efficiency: 93.0 },
  { month: 'April 2026', shortMonth: 'Apr', billed: 460000, collected: 414000, efficiency: 90.0 },
  { month: 'May 2026', shortMonth: 'May', billed: 470000, collected: 413600, efficiency: 88.0 },
  { month: 'June 2026', shortMonth: 'Jun', billed: 460000, collected: 386400, efficiency: 84.0 },
  {
    month: 'July 2026',
    shortMonth: 'Jul',
    billed: 480000,
    collected: 326400,
    efficiency: 68.0,
    isSeasonalDrop: true,
    dropReason: 'Summer Recess & Family Vacations: Delayed challan deposits before reopening.',
  },
  {
    month: 'August 2026',
    shortMonth: 'Aug',
    billed: 490000,
    collected: 372400,
    efficiency: 76.0,
    isSeasonalDrop: true,
    dropReason: 'Monsoon season / delayed post-vacation re-enrollment reconciliations.',
  },
  { month: 'September 2026', shortMonth: 'Sep', billed: 510000, collected: 484500, efficiency: 95.0 },
  { month: 'October 2026', shortMonth: 'Oct', billed: 520000, collected: 499200, efficiency: 96.0 },
  { month: 'November 2026', shortMonth: 'Nov', billed: 500000, collected: 465000, efficiency: 93.0 },
  { month: 'December 2026', shortMonth: 'Dec', billed: 480000, collected: 436800, efficiency: 91.0 },
];

export const FeeCollectionAnalysisD3: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [hoveredData, setHoveredData] = useState<MonthlyFeeData | null>(null);

  // Compute dataset (could scale by batch factor)
  const batchMultiplier =
    selectedBatch === 'Matric Science'
      ? 0.35
      : selectedBatch === 'F.Sc Pre-Medical'
      ? 0.45
      : selectedBatch === 'Computer Science'
      ? 0.2
      : 1.0;

  const dataset: MonthlyFeeData[] = ACADEMIC_YEAR_2026.map((item) => ({
    ...item,
    billed: Math.round(item.billed * batchMultiplier),
    collected: Math.round(item.collected * batchMultiplier),
    efficiency: item.efficiency,
  }));

  const totalBilled = dataset.reduce((acc, d) => acc + d.billed, 0);
  const totalCollected = dataset.reduce((acc, d) => acc + d.collected, 0);
  const overallEfficiency = Math.round((totalCollected / totalBilled) * 1000) / 10;
  const seasonalDropMonths = dataset.filter((d) => d.isSeasonalDrop);

  // D3 Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const width = Math.max(680, containerWidth);
    const height = 400;
    const margin = { top: 40, right: 65, bottom: 55, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height)
      .style('overflow', 'visible');

    // Create main chart group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Months)
    const xScale = d3
      .scaleBand()
      .domain(dataset.map((d) => d.shortMonth))
      .range([0, innerWidth])
      .padding(0.3);

    // Y Scale Left (PKR Currency)
    const maxAmount = (d3.max(dataset, (d) => Math.max(d.billed, d.collected)) || 500000) * 1.15;
    const yScaleAmount = d3
      .scaleLinear()
      .domain([0, maxAmount])
      .nice()
      .range([innerHeight, 0]);

    // Y Scale Right (Efficiency %)
    const yScaleEfficiency = d3
      .scaleLinear()
      .domain([50, 100])
      .range([innerHeight, 0]);

    // Background horizontal grid lines
    const yAxisGrid = d3
      .axisLeft(yScaleAmount)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '3 3');

    // Seasonal Drop Highlight Region (July - August)
    const julX = xScale('Jul');
    const augX = xScale('Aug');
    if (julX !== undefined && augX !== undefined) {
      const bandwidth = xScale.bandwidth();
      const dropStartX = julX - bandwidth * 0.2;
      const dropWidth = augX + bandwidth * 1.2 - dropStartX;

      g.append('rect')
        .attr('x', dropStartX)
        .attr('y', 0)
        .attr('width', dropWidth)
        .attr('height', innerHeight)
        .attr('fill', '#fff1f2')
        .attr('opacity', 0.8)
        .attr('rx', 8);

      g.append('text')
        .attr('x', dropStartX + dropWidth / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e11d48')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.05em')
        .text('SEASONAL COLLECTION DROP (SUMMER RECESS)');
    }

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((group) => {
        group.select('.domain').attr('stroke', '#cbd5e1');
        group.selectAll('text')
          .attr('fill', '#475569')
          .attr('font-weight', '600')
          .attr('font-size', '11px')
          .attr('dy', '1.2em');
      });

    // Y Axis Left (Amount in PKR)
    const yAxisLeft = d3
      .axisLeft(yScaleAmount)
      .ticks(6)
      .tickFormat((d) => `PKR ${(Number(d) / 1000).toFixed(0)}k`);

    g.append('g')
      .call(yAxisLeft)
      .call((group) => {
        group.select('.domain').remove();
        group.selectAll('text')
          .attr('fill', '#64748b')
          .attr('font-weight', '600')
          .attr('font-size', '10px');
      });

    // Y Axis Right (Efficiency %)
    const yAxisRight = d3
      .axisRight(yScaleEfficiency)
      .ticks(5)
      .tickFormat((d) => `${d}%`);

    g.append('g')
      .attr('transform', `translate(${innerWidth},0)`)
      .call(yAxisRight)
      .call((group) => {
        group.select('.domain').remove();
        group.selectAll('text')
          .attr('fill', '#6366f1')
          .attr('font-weight', '700')
          .attr('font-size', '10px');
      });

    // Sub-bar scale for side-by-side bars (Billed vs Collected)
    const xSubScale = d3
      .scaleBand()
      .domain(['billed', 'collected'])
      .range([0, xScale.bandwidth()])
      .padding(0.08);

    // Bars: Target Billed
    g.selectAll('.bar-billed')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('class', 'bar-billed')
      .attr('x', (d) => (xScale(d.shortMonth) || 0) + (xSubScale('billed') || 0))
      .attr('y', (d) => yScaleAmount(d.billed))
      .attr('width', xSubScale.bandwidth())
      .attr('height', (d) => innerHeight - yScaleAmount(d.billed))
      .attr('fill', '#94a3b8')
      .attr('rx', 4)
      .attr('opacity', 0.65)
      .on('mouseenter', (_, d) => setHoveredData(d));

    // Bars: Realized Collected
    g.selectAll('.bar-collected')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('class', 'bar-collected')
      .attr('x', (d) => (xScale(d.shortMonth) || 0) + (xSubScale('collected') || 0))
      .attr('y', (d) => yScaleAmount(d.collected))
      .attr('width', xSubScale.bandwidth())
      .attr('height', (d) => innerHeight - yScaleAmount(d.collected))
      .attr('fill', (d) => (d.isSeasonalDrop ? '#f43f5e' : '#10b981'))
      .attr('rx', 4)
      .on('mouseenter', (_, d) => setHoveredData(d));

    // Efficiency Curve Generator
    const lineGenerator = d3
      .line<MonthlyFeeData>()
      .x((d) => (xScale(d.shortMonth) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScaleEfficiency(d.efficiency))
      .curve(d3.curveMonotoneX);

    // Efficiency Line Path
    g.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '0')
      .attr('d', lineGenerator);

    // Efficiency Data Circles
    g.selectAll('.efficiency-dot')
      .data(dataset)
      .enter()
      .append('circle')
      .attr('class', 'efficiency-dot')
      .attr('cx', (d) => (xScale(d.shortMonth) || 0) + xScale.bandwidth() / 2)
      .attr('cy', (d) => yScaleEfficiency(d.efficiency))
      .attr('r', (d) => (d.isSeasonalDrop ? 6 : 4.5))
      .attr('fill', (d) => (d.isSeasonalDrop ? '#e11d48' : '#ffffff'))
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => setHoveredData(d));

    // Efficiency Percentage Labels above dots
    g.selectAll('.efficiency-label')
      .data(dataset)
      .enter()
      .append('text')
      .attr('class', 'efficiency-label')
      .attr('x', (d) => (xScale(d.shortMonth) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScaleEfficiency(d.efficiency) - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', (d) => (d.isSeasonalDrop ? '#e11d48' : '#312e81'))
      .text((d) => `${d.efficiency}%`);

  }, [dataset]);

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base font-black text-slate-900">
              Fee Collection Efficiency Analysis
            </h2>
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
              D3 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Month-over-month target invoicing vs realized receipts with seasonal drop detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batch Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              aria-label="Filter by department"
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              <option value="Matric Science">Matric Science</option>
              <option value="F.Sc Pre-Medical">F.Sc Pre-Medical</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>

          {/* Year Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            Academic Year {selectedYear}
          </div>

          {/* Print Report */}
          <button
            type="button"
            onClick={() => triggerBrowserPrint()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Annual Invoiced Target</div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            PKR {totalBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">12 Calendar Months Total</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase">Realized Cash Collections</div>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">
            PKR {totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            Deficit: PKR {(totalBilled - totalCollected).toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-indigo-200 bg-indigo-50/30 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase">Mean Collection Efficiency</div>
          <div className="text-xl font-black text-indigo-700 font-mono mt-1">
            {overallEfficiency}%
          </div>
          <div className="text-[11px] text-indigo-600 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Institutional Target: &gt;85%
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/40 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-700 uppercase">Severe Seasonal Drop</div>
          <div className="text-xl font-black text-rose-700 font-mono mt-1">
            July (68%) &amp; Aug (76%)
          </div>
          <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5" /> -22% Below Mean
          </div>
        </div>
      </div>

      {/* D3 Chart Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Month-over-Month Efficiency Trajectory &amp; Realized Revenue
            </h3>
            <p className="text-xs text-slate-500">
              Side-by-side bars indicate target billed vs collected cash; purple spline represents collection efficiency (%).
            </p>
          </div>

          {/* Chart Legends */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-400 opacity-60 inline-block" />
              <span className="text-slate-600">Billed Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-600">Collected Cash</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span className="text-rose-600 font-bold">Seasonal Drop Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-indigo-600 inline-block" />
              <span className="text-indigo-600 font-bold">Efficiency %</span>
            </div>
          </div>
        </div>

        {/* Responsive D3 SVG Container */}
        <div ref={containerRef} className="w-full overflow-x-auto py-2">
          <svg ref={svgRef} className="w-full min-w-[650px]" />
        </div>

        {/* Hover / Selected Month Detail Card */}
        {hoveredData ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="space-y-0.5">
              <div className="font-black text-slate-900 flex items-center gap-2">
                <span>{hoveredData.month}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    hoveredData.efficiency >= 90
                      ? 'bg-emerald-100 text-emerald-800'
                      : hoveredData.efficiency >= 80
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {hoveredData.efficiency}% Efficiency
                </span>
              </div>
              {hoveredData.dropReason && (
                <p className="text-rose-600 font-medium">{hoveredData.dropReason}</p>
              )}
            </div>

            <div className="flex items-center gap-5">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Billed Target</span>
                <span className="font-mono font-black text-slate-800">
                  PKR {hoveredData.billed.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Collected Cash</span>
                <span className="font-mono font-black text-emerald-600">
                  PKR {hoveredData.collected.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Shortfall</span>
                <span className="font-mono font-black text-rose-600">
                  PKR {(hoveredData.billed - hoveredData.collected).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Hover over any bar or circular data point to inspect month-specific billing and collection details.
          </div>
        )}
      </div>

      {/* Seasonal Drop Analysis Insights & Actionable Recovery Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <h3>Seasonal Drop Root-Cause Diagnostics</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Data reveals systematic collection dips every <strong>July (68%)</strong> and <strong>August (76%)</strong>.
            During the annual summer recess, campus physical counters experience an 85% drop in footfall. Parents traditionally postpone challan deposits until the resumption of physical classes in September.
          </p>
          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 bg-white/80 rounded-xl border border-rose-100 flex items-start gap-2">
              <span className="font-black text-rose-600">1.</span>
              <span className="text-slate-700">
                <strong>July Drop:</strong> PKR {(ACADEMIC_YEAR_2026[6].billed - ACADEMIC_YEAR_2026[6].collected).toLocaleString()} deferred cash inflow.
              </span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-rose-100 flex items-start gap-2">
              <span className="font-black text-rose-600">2.</span>
              <span className="text-slate-700">
                <strong>August Slow Recovery:</strong> Post-monsoon reopening causes a backlog of bank branch deposits.
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3>Recommended Mitigation &amp; Recovery Workflow</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Implement digital prepayment incentives and advance billing schedules prior to summer recess:
          </p>
          <ul className="space-y-2 pt-1 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Pre-Vacation Combined Challans:</strong> Issue June &amp; July fees in late May with an early-bird 5% concession waiver.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Digital 1Link / Kuickpay Integration:</strong> Enable mobile app banking and JazzCash/Easypaisa payments so parents don't rely on physical campus visits.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Automated Bulk WhatsApp Reminders:</strong> Schedule automated payment reminders 7 days and 2 days prior to the mid-July due date.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
