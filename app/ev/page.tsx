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
      </Tabs>
    </div>
  );
}
