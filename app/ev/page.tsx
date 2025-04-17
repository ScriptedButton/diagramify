"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Iteration {
  id: number;
  name: string;
  plannedCost: number;
  duration: number;
  actualCost: number;
  percentComplete: number;
}

interface DetailedCalculations {
  pv: string;
  ev: string;
  ac: string;
  cv: string;
  sv: string;
  cpi: string;
  spi: string;
  bac: string;
  etc: string;
  eac: string;
}

interface AlgebraicState {
  pv: string;
  ev: string;
  ac: string;
  sv: string;
  cv: string;
  cpi: string;
  spi: string;
  bac: string;
  etc: string;
  eac: string;
  solveFor: string;
  calculatedValues: Record<string, number>;
}

export default function EarnedValueAnalysis() {
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [newIteration, setNewIteration] = useState<Iteration>({
    id: 1,
    name: "",
    plannedCost: 0,
    duration: 0,
    actualCost: 0,
    percentComplete: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detailedCalcs, setDetailedCalcs] = useState<DetailedCalculations>({
    pv: "",
    ev: "",
    ac: "",
    cv: "",
    sv: "",
    cpi: "",
    spi: "",
    bac: "",
    etc: "",
    eac: "",
  });

  const [results, setResults] = useState({
    pv: 0,
    ev: 0,
    ac: 0,
    sv: 0,
    cv: 0,
    spi: 0,
    cpi: 0,
    bac: 0,
    etc: 0,
    eac: 0,
    tcpi: 0,
  });

  const [algebraicState, setAlgebraicState] = useState<AlgebraicState>({
    pv: "",
    ev: "",
    ac: "",
    sv: "",
    cv: "",
    cpi: "",
    spi: "",
    bac: "",
    etc: "",
    eac: "",
    solveFor: "none",
    calculatedValues: {}
  });

  const addIteration = () => {
    if (newIteration.name) {
      setIterations([
        ...iterations,
        { ...newIteration, id: iterations.length + 1 },
      ]);
      setNewIteration({
        id: iterations.length + 2,
        name: "",
        plannedCost: 0,
        duration: 0,
        actualCost: 0,
        percentComplete: 0,
      });
    }
  };

  const calculateEVA = () => {
    // Calculate cumulative values with detailed steps
    const bac = iterations.reduce((sum, iter) => sum + iter.plannedCost, 0);
    
    // Calculate PV with formula
    const pvCalcSteps = iterations
      .filter(iter => iter.percentComplete > 0)
      .map(iter => iter.plannedCost.toLocaleString())
      .join(" + ");
    const pv = iterations.reduce(
      (sum, iter) => sum + (iter.percentComplete > 0 ? iter.plannedCost : 0),
      0
    );

    // Calculate EV with formula
    const evCalcSteps = iterations
      .map(iter => {
        return iter.percentComplete === 100 
          ? iter.plannedCost.toLocaleString()
          : iter.percentComplete > 0 
            ? `(${iter.percentComplete/100} × ${iter.plannedCost.toLocaleString()})`
            : null;
      })
      .filter(Boolean)
      .join(" + ");
    const ev = iterations.reduce(
      (sum, iter) => sum + (iter.plannedCost * iter.percentComplete) / 100,
      0
    );

    // Calculate AC with formula
    const acCalcSteps = iterations
      .filter(iter => iter.actualCost > 0)
      .map(iter => iter.actualCost.toLocaleString())
      .join(" + ");
    const ac = iterations.reduce((sum, iter) => sum + iter.actualCost, 0);

    // Calculate variances and indices
    const sv = ev - pv;
    const cv = ev - ac;
    const spi = pv !== 0 ? ev / pv : 0;
    const cpi = ac !== 0 ? ev / ac : 0;
    const etc = cpi !== 0 ? (bac - ev) / cpi : 0;
    const eac = ac + etc;

    // Store detailed calculations
    setDetailedCalcs({
      pv: `Planned Value (PV): = ${pvCalcSteps} = $${pv.toLocaleString()}`,
      ev: `Earned Value (EV): = ${evCalcSteps} = $${ev.toLocaleString()}`,
      ac: `Actual Cost (AC): = ${acCalcSteps} = $${ac.toLocaleString()}`,
      cv: `Cost Variance (CV): = EV − AC = ${ev.toLocaleString()} − ${ac.toLocaleString()} = $${cv.toLocaleString()}`,
      sv: `Schedule Variance (SV): = EV − PV = ${ev.toLocaleString()} − ${pv.toLocaleString()} = $${sv.toLocaleString()}`,
      cpi: `Cost Performance Index (CPI): = EV ÷ AC = ${ev.toLocaleString()} ÷ ${ac.toLocaleString()} = ${cpi.toFixed(2)}`,
      spi: `Schedule Performance Index (SPI): = EV ÷ PV = ${ev.toLocaleString()} ÷ ${pv.toLocaleString()} = ${spi.toFixed(2)}`,
      bac: `Budget at Completion (BAC): = $${bac.toLocaleString()}`,
      etc: `Estimate to Complete (ETC): = (BAC − EV) ÷ CPI = (${bac.toLocaleString()} − ${ev.toLocaleString()}) ÷ ${cpi.toFixed(2)} = $${etc.toLocaleString()}`,
      eac: `Estimate at Completion (EAC): = AC + ETC = ${ac.toLocaleString()} + ${etc.toLocaleString()} = $${eac.toLocaleString()}`
    });

    setResults({
      pv,
      ev,
      ac,
      sv,
      cv,
      spi,
      cpi,
      bac,
      etc,
      eac,
      tcpi: ac !== bac ? (bac - ev) / (bac - ac) : 0,
    });
  };

  const handleIterationChange = (
    field: keyof Iteration,
    value: string | number
  ) => {
    setNewIteration((prev) => ({
      ...prev,
      [field]:
        typeof value === "string" && field !== "name"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const getPerformanceStatus = (value: number, type: "schedule" | "cost") => {
    if (type === "schedule") {
      return value >= 0 ? "On Schedule" : "Behind Schedule";
    } else {
      return value >= 0 ? "Under Budget" : "Over Budget";
    }
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const exportToJson = () => {
    const data = {
      iterations,
      results: results,
      detailedCalculations: detailedCalcs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ev-analysis.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setIterations(data.iterations);
          setResults(data.results);
          setDetailedCalcs(data.detailedCalculations);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const solveMetric = (metric: string, values: Record<string, number>): { result: number; formula: string } | null => {
    let result = 0;
    let formula = "";

    switch (metric) {
      case "pv":
        if (values.ev && values.sv) {
          result = roundToTwo(values.ev - values.sv);
          formula = `PV = EV - SV = ${values.ev} - ${values.sv} = ${result}`;
        } else if (values.ev && values.spi) {
          result = roundToTwo(values.ev / values.spi);
          formula = `PV = EV / SPI = ${values.ev} / ${values.spi} = ${result}`;
        } else {
          return null;
        }
        break;

      case "ev":
        if (values.pv && values.sv) {
          result = roundToTwo(values.pv + values.sv);
          formula = `EV = PV + SV = ${values.pv} + ${values.sv} = ${result}`;
        } else if (values.ac && values.cv) {
          result = roundToTwo(values.ac + values.cv);
          formula = `EV = AC + CV = ${values.ac} + ${values.cv} = ${result}`;
        } else if (values.pv && values.spi) {
          result = roundToTwo(values.pv * values.spi);
          formula = `EV = PV × SPI = ${values.pv} × ${values.spi} = ${result}`;
        } else if (values.ac && values.cpi) {
          result = roundToTwo(values.ac * values.cpi);
          formula = `EV = AC × CPI = ${values.ac} × ${values.cpi} = ${result}`;
        } else {
          return null;
        }
        break;

      case "ac":
        if (values.ev && values.cv) {
          result = roundToTwo(values.ev - values.cv);
          formula = `AC = EV - CV = ${values.ev} - ${values.cv} = ${result}`;
        } else if (values.ev && values.cpi) {
          result = roundToTwo(values.ev / values.cpi);
          formula = `AC = EV / CPI = ${values.ev} / ${values.cpi} = ${result}`;
        } else {
          return null;
        }
        break;

      case "sv":
        if (values.ev && values.pv) {
          result = roundToTwo(values.ev - values.pv);
          formula = `SV = EV - PV = ${values.ev} - ${values.pv} = ${result}`;
        } else {
          return null;
        }
        break;

      case "cv":
        if (values.ev && values.ac) {
          result = roundToTwo(values.ev - values.ac);
          formula = `CV = EV - AC = ${values.ev} - ${values.ac} = ${result}`;
        } else {
          return null;
        }
        break;

      case "cpi":
        if (values.ev && values.ac) {
          result = roundToTwo(values.ev / values.ac);
          formula = `CPI = EV / AC = ${values.ev} / ${values.ac} = ${result}`;
        } else {
          return null;
        }
        break;

      case "spi":
        if (values.ev && values.pv) {
          result = roundToTwo(values.ev / values.pv);
          formula = `SPI = EV / PV = ${values.ev} / ${values.pv} = ${result}`;
        } else {
          return null;
        }
        break;

      case "etc":
        if (values.bac && values.ev && values.cpi) {
          result = roundToTwo((values.bac - values.ev) / values.cpi);
          formula = `ETC = (BAC - EV) / CPI = (${values.bac} - ${values.ev}) / ${values.cpi} = ${result}`;
        } else {
          return null;
        }
        break;

      case "eac":
        if (values.ac && values.etc) {
          result = roundToTwo(values.ac + values.etc);
          formula = `EAC = AC + ETC = ${values.ac} + ${values.etc} = ${result}`;
        } else if (values.bac && values.cpi) {
          result = roundToTwo(values.bac / values.cpi);
          formula = `EAC = BAC / CPI = ${values.bac} / ${values.cpi} = ${result}`;
        } else {
          return null;
        }
        break;

      default:
        return null;
    }

    return { result, formula };
  };

  const handleAlgebraicChange = (field: keyof Omit<AlgebraicState, 'calculatedValues'>, value: string) => {
    setAlgebraicState(prev => {
      const newState = {
        ...prev,
        [field]: value,
        calculatedValues: { ...prev.calculatedValues }
      } as AlgebraicState;

      // If we're just changing which metric to solve for, don't clear any values
      if (field === "solveFor") {
        return newState;
      }

      const derivedMetrics = new Set([
        "sv",  // Derived from EV and PV
        "cv",  // Derived from EV and AC
        "cpi", // Derived from EV and AC
        "spi", // Derived from EV and PV
        "etc", // Derived from BAC, EV, and CPI
        "eac"  // Derived from AC and ETC or BAC and CPI
      ]);

      // Convert all non-empty strings to numbers and include calculated values
      const values: Record<string, number> = {
        ...newState.calculatedValues
      };
      
      // Add user-input values
      Object.entries(newState).forEach(([key, val]) => {
        if (key !== "solveFor" && key !== "calculatedValues" && val !== "") {
          values[key] = parseFloat(val as string);
        }
      });

      // Only clear derived metrics that depend on the changed field
      Object.keys(newState).forEach(metric => {
        if (metric !== "solveFor" && 
            metric !== "calculatedValues" && 
            derivedMetrics.has(metric)) {  // Only clear derived metrics
          const required = getRequiredFields(metric);
          if (required.includes(field)) {
            delete newState.calculatedValues[metric];
            newState[metric as keyof Omit<AlgebraicState, 'calculatedValues'>] = "";
          }
        }
      });

      // Try to solve metrics in dependency order, but only for derived metrics
      const solved = new Set<string>();
      let madeProgress = true;

      while (madeProgress) {
        madeProgress = false;
        Object.keys(newState).forEach(metric => {
          if (metric !== "solveFor" && 
              metric !== "calculatedValues" && 
              metric !== field &&
              derivedMetrics.has(metric) && // Only solve for derived metrics
              !solved.has(metric) &&
              newState[metric as keyof Omit<AlgebraicState, 'calculatedValues'>] === "") {
            
            const required = getRequiredFields(metric);
            const hasAllRequired = required.every(req => 
              values[req] !== undefined || solved.has(req)
            );

            if (hasAllRequired) {
              const solution = solveMetric(metric, values);
              if (solution) {
                newState[metric as keyof Omit<AlgebraicState, 'calculatedValues'>] = solution.result.toString();
                newState.calculatedValues[metric] = solution.result;
                values[metric] = solution.result;
                solved.add(metric);
                madeProgress = true;
              }
            }
          }
        });
      }

      return newState;
    });
  };

  const getRequiredFields = (metric: string): string[] => {
    switch (metric) {
      case "pv":
        return ["ev", "sv"];
      case "ev":
        return ["pv", "sv"];
      case "ac":
        return ["ev", "cv"];
      case "sv":
        return ["ev", "pv"];
      case "cv":
        return ["ev", "ac"];
      case "cpi":
        return ["ev", "ac"];
      case "spi":
        return ["ev", "pv"];
      case "etc":
        return ["bac", "ev", "cpi"];
      case "eac":
        return ["ac", "etc"];
      default:
        return [];
    }
  };

  const getAlternativeFields = (metric: string): string[] => {
    switch (metric) {
      case "pv":
        return ["ev", "spi"];
      case "ev":
        return ["ac", "cv", "pv", "spi", "ac", "cpi"];
      case "ac":
        return ["ev", "cpi"];
      case "eac":
        return ["bac", "cpi"];
      default:
        return [];
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      pv: "Planned Value",
      ev: "Earned Value",
      ac: "Actual Cost",
      sv: "Schedule Variance",
      cv: "Cost Variance",
      cpi: "Cost Performance Index",
      spi: "Schedule Performance Index",
      bac: "Budget at Completion",
      etc: "Estimate to Complete",
      eac: "Estimate at Completion"
    };
    return labels[field] || field;
  };

  const getSolution = (state: AlgebraicState) => {
    if (state.solveFor === "none") return null;

    const values: Record<string, number> = {
      ...state.calculatedValues
    };

    Object.entries(state).forEach(([key, val]) => {
      if (key !== "solveFor" && key !== "calculatedValues" && val !== "") {
        values[key] = parseFloat(val);
      }
    });

    const solution = solveMetric(state.solveFor, values);
    if (solution) {
      // Store the solved value in calculatedValues for future use
      state.calculatedValues[state.solveFor] = solution.result;
    }
    return solution;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Project Iterations Analysis</h1>
      
      <div className="flex gap-4 mb-8">
        <Button onClick={exportToJson}>
          Export Analysis
        </Button>
        <Button onClick={() => fileInputRef.current?.click()}>
          Import Analysis
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={importFromJson}
        />
      </div>

      <Tabs defaultValue="iterations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="iterations">Iterations</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="calculations">Detailed Calculations</TabsTrigger>
          <TabsTrigger value="algebraic">Algebraic Solver</TabsTrigger>
        </TabsList>

        <TabsContent value="iterations">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Add New Iteration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Iteration Name</Label>
                    <Input
                      value={newIteration.name}
                      onChange={(e) =>
                        handleIterationChange("name", e.target.value)
                      }
                      placeholder="e.g., Release One"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Planned Cost</Label>
                    <Input
                      type="number"
                      value={newIteration.plannedCost || ""}
                      onChange={(e) =>
                        handleIterationChange("plannedCost", e.target.value)
                      }
                      placeholder="Planned cost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Months)</Label>
                    <Input
                      type="number"
                      value={newIteration.duration || ""}
                      onChange={(e) =>
                        handleIterationChange("duration", e.target.value)
                      }
                      placeholder="Duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Cost</Label>
                    <Input
                      type="number"
                      value={newIteration.actualCost || ""}
                      onChange={(e) =>
                        handleIterationChange("actualCost", e.target.value)
                      }
                      placeholder="Actual cost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>% Complete</Label>
                    <Input
                      type="number"
                      value={newIteration.percentComplete || ""}
                      onChange={(e) =>
                        handleIterationChange("percentComplete", e.target.value)
                      }
                      placeholder="Percent complete"
                    />
                  </div>
                </div>
                <Button onClick={addIteration} className="mt-4">
                  Add Iteration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Iterations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Iteration</TableHead>
                      <TableHead>Planned Cost</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actual Cost</TableHead>
                      <TableHead>% Complete</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {iterations.map((iteration) => (
                      <TableRow key={iteration.id}>
                        <TableCell>{iteration.name}</TableCell>
                        <TableCell>
                          ${iteration.plannedCost.toLocaleString()}
                        </TableCell>
                        <TableCell>{iteration.duration} months</TableCell>
                        <TableCell>
                          ${iteration.actualCost.toLocaleString()}
                        </TableCell>
                        <TableCell>{iteration.percentComplete}%</TableCell>
                        <TableCell>
                          {(() => {
                            const { plannedCost, actualCost, percentComplete } =
                              iteration;

                            if (percentComplete === 0) {
                              return (
                                <Badge className="bg-gray-100 text-gray-700">
                                  Not Started
                                </Badge>
                              );
                            }

                            if (percentComplete < 100) {
                              const ev = (plannedCost * percentComplete) / 100;
                              const cv = ev - actualCost;
                              return (
                                <Badge className={getPerformanceColor(cv)}>
                                  {cv > 0
                                    ? "Under Budget"
                                    : cv < 0
                                      ? "Over Budget"
                                      : "On Budget"}
                                </Badge>
                              );
                            }

                            // 100% complete
                            return (
                              <Badge
                                className={getPerformanceColor(
                                  plannedCost - actualCost
                                )}
                              >
                                {actualCost <= plannedCost
                                  ? "Under Budget"
                                  : "Over Budget"}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {iterations.length > 0 && (
                  <Button onClick={calculateEVA} className="mt-4">
                    Calculate EVA
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Planned Value (PV)</Label>
                      <div className="text-2xl font-bold">
                        ${results.pv.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label>Earned Value (EV)</Label>
                      <div className="text-2xl font-bold">
                        ${results.ev.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label>Actual Cost (AC)</Label>
                      <div className="text-2xl font-bold">
                        ${results.ac.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label>Budget at Completion (BAC)</Label>
                      <div className="text-2xl font-bold">
                        ${results.bac.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Schedule Variance (SV)</span>
                      <Badge className={getPerformanceColor(results.sv)}>
                        ${results.sv.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {getPerformanceStatus(results.sv, "schedule")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Cost Variance (CV)</span>
                      <Badge className={getPerformanceColor(results.cv)}>
                        ${results.cv.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {getPerformanceStatus(results.cv, "cost")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Indices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Schedule Performance Index (SPI)</span>
                      <Badge className={getPerformanceColor(results.spi - 1)}>
                        {results.spi.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results.spi >= 1
                        ? "Ahead of Schedule"
                        : "Behind Schedule"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Cost Performance Index (CPI)</span>
                      <Badge className={getPerformanceColor(results.cpi - 1)}>
                        {results.cpi.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results.cpi >= 1 ? "Under Budget" : "Over Budget"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>To-Complete Performance Index (TCPI)</span>
                      <Badge className={getPerformanceColor(1 - results.tcpi)}>
                        {results.tcpi.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results.tcpi > 1
                        ? "Need to improve efficiency"
                        : "Current efficiency sufficient"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Estimate to Complete (ETC)</span>
                      <span className="font-medium">
                        ${results.etc.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Remaining cost to complete the project
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Estimate at Completion (EAC)</span>
                      <span className="font-medium">
                        ${results.eac.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total expected cost at completion
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Variance at Completion (VAC)</span>
                      <Badge
                        className={getPerformanceColor(
                          results.bac - results.eac
                        )}
                      >
                        ${(results.bac - results.eac).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {results.bac - results.eac >= 0
                        ? "Under Budget"
                        : "Over Budget"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculations">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-mono text-sm">
                <pre>{detailedCalcs.pv}</pre>
                <pre>{detailedCalcs.ev}</pre>
                <pre>{detailedCalcs.ac}</pre>
                <pre>{detailedCalcs.cv}</pre>
                <pre>{detailedCalcs.sv}</pre>
                <pre>{detailedCalcs.cpi}</pre>
                <pre>{detailedCalcs.spi}</pre>
                <pre>{detailedCalcs.bac}</pre>
                <pre>{detailedCalcs.etc}</pre>
                <pre>{detailedCalcs.eac}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algebraic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Algebraic Solver</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Solve For</Label>
                    <Select
                      value={algebraicState.solveFor}
                      onValueChange={(value) => handleAlgebraicChange("solveFor", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric to solve for" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="pv">Planned Value (PV)</SelectItem>
                        <SelectItem value="ev">Earned Value (EV)</SelectItem>
                        <SelectItem value="ac">Actual Cost (AC)</SelectItem>
                        <SelectItem value="sv">Schedule Variance (SV)</SelectItem>
                        <SelectItem value="cv">Cost Variance (CV)</SelectItem>
                        <SelectItem value="cpi">Cost Performance Index (CPI)</SelectItem>
                        <SelectItem value="spi">Schedule Performance Index (SPI)</SelectItem>
                        <SelectItem value="etc">Estimate to Complete (ETC)</SelectItem>
                        <SelectItem value="eac">Estimate at Completion (EAC)</SelectItem>
                      </SelectContent>
                    </Select>
                    {algebraicState.solveFor !== "none" && (
                      <div className="text-sm text-gray-500">
                        <p className="font-medium">Required values:</p>
                        <ul className="list-disc list-inside">
                          {getRequiredFields(algebraicState.solveFor).map(field => (
                            <li key={field}>{getFieldLabel(field)} ({field.toUpperCase()})</li>
                          ))}
                        </ul>
                        {getAlternativeFields(algebraicState.solveFor).length > 0 && (
                          <>
                            <p className="font-medium mt-2">Alternative combinations:</p>
                            <ul className="list-disc list-inside">
                              {getAlternativeFields(algebraicState.solveFor).map(field => (
                                <li key={field}>{getFieldLabel(field)} ({field.toUpperCase()})</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(algebraicState).map(([key, value]) => {
                      // Skip internal state fields
                      if (key === "solveFor" || key === "calculatedValues") return null;

                      const isRequired = getRequiredFields(algebraicState.solveFor).includes(key);
                      const isDisabled = algebraicState.solveFor === key;
                      
                      return (
                        <div key={key} className="space-y-2">
                          <Label className="flex items-center gap-2">
                            {getFieldLabel(key)} ({key.toUpperCase()})
                            {isRequired && !isDisabled && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleAlgebraicChange(key as keyof Omit<AlgebraicState, 'calculatedValues'>, e.target.value)}
                            placeholder={`Enter ${key.toUpperCase()}`}
                            disabled={isDisabled}
                            className={isRequired && !isDisabled ? "border-red-200" : ""}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solution</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const solution = getSolution(algebraicState);
                  if (solution) {
                    // Store the solved value in the input field
                    if (algebraicState.solveFor !== "none") {
                      const field = algebraicState.solveFor as keyof Omit<AlgebraicState, 'calculatedValues'>;
                      // Use setTimeout to avoid state update during render
                      setTimeout(() => {
                        handleAlgebraicChange(field, solution.result.toString());
                      }, 0);
                    }
                    return (
                      <div className="space-y-4">
                        <div className="font-mono text-sm">
                          <pre>{solution.formula}</pre>
                        </div>
                        <div className="text-2xl font-bold">
                          {algebraicState.solveFor.toUpperCase()} = ${solution.result.toLocaleString()}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="text-gray-500">
                      Select a metric to solve for and enter the known values
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
