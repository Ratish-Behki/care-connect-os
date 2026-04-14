import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Brain, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

interface TriageResult {
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  recommendedDepartment: string;
  possibleConditions: string[];
  actions: string[];
}

// Mock AI triage logic — replace with real AI via Lovable Cloud later
const mockTriage = (symptoms: string): TriageResult => {
  const lower = symptoms.toLowerCase();

  if (lower.includes('chest pain') || lower.includes('breathing') || lower.includes('unconscious') || lower.includes('severe bleeding')) {
    return {
      severity: 'high',
      confidence: 92,
      recommendedDepartment: 'Emergency / Cardiology',
      possibleConditions: ['Cardiac Event', 'Pulmonary Embolism', 'Acute Respiratory Distress'],
      actions: ['Call ambulance immediately', 'Alert emergency department', 'Prioritize in queue'],
    };
  }

  if (lower.includes('fever') || lower.includes('headache') || lower.includes('vomiting') || lower.includes('pain')) {
    return {
      severity: 'medium',
      confidence: 78,
      recommendedDepartment: 'General Medicine',
      possibleConditions: ['Viral Infection', 'Migraine', 'Gastroenteritis'],
      actions: ['Schedule priority appointment', 'Monitor vitals', 'Recommend hydration'],
    };
  }

  return {
    severity: 'low',
    confidence: 85,
    recommendedDepartment: 'General Medicine',
    possibleConditions: ['Common Cold', 'Minor Allergy', 'Fatigue'],
    actions: ['Schedule regular appointment', 'Recommend OTC medication', 'Follow up in 48 hours'],
  };
};

const severityConfig = {
  low: { color: 'bg-success/10 text-success border-success/30', icon: CheckCircle, label: 'Low Priority', bg: 'bg-success' },
  medium: { color: 'bg-warning/10 text-warning border-warning/30', icon: AlertTriangle, label: 'Medium Priority', bg: 'bg-warning' },
  high: { color: 'bg-emergency/10 text-emergency border-emergency/30', icon: AlertTriangle, label: 'High Emergency', bg: 'bg-emergency' },
};

const SymptomTriagePage = () => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!symptoms.trim()) {
      toast({ title: 'Please describe your symptoms', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    // Simulate AI processing delay
    setTimeout(() => {
      const triageResult = mockTriage(symptoms);
      setResult(triageResult);
      setIsAnalyzing(false);

      if (triageResult.severity === 'high') {
        toast({
          title: '🚨 High Emergency Detected',
          description: 'Ambulance has been prioritized. Emergency department alerted.',
        });
      }
    }, 2000);
  };

  const config = result ? severityConfig[result.severity] : null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">AI Symptom Triage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Describe your symptoms and our AI will predict severity and recommend next steps
          </p>
        </div>

        {/* Input Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Describe Your Symptoms</h2>
          </div>
          <Textarea
            placeholder="e.g., I've been having chest pain since morning with difficulty breathing..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[120px] resize-none"
            aria-label="Symptom description"
          />
          <div className="flex flex-wrap gap-2">
            <p className="text-xs text-muted-foreground mr-2">Quick examples:</p>
            {['Chest pain and shortness of breath', 'High fever with headache', 'Mild cough and runny nose'].map((ex) => (
              <button
                key={ex}
                onClick={() => setSymptoms(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !symptoms.trim()}
            className="w-full gradient-primary text-primary-foreground border-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Symptoms...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" /> Analyze Symptoms
              </>
            )}
          </Button>
        </motion.div>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {result && config && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Severity Banner */}
              <div className={`glass-card p-6 border ${config.color}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${config.bg}/10 flex items-center justify-center`}>
                    <config.icon className={`w-7 h-7 ${result.severity === 'low' ? 'text-success' : result.severity === 'medium' ? 'text-warning' : 'text-emergency'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold text-foreground">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">Confidence: {result.confidence}%</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full border-4 ${result.severity === 'high' ? 'border-emergency' : result.severity === 'medium' ? 'border-warning' : 'border-success'} flex items-center justify-center`}>
                    <span className="font-display font-bold text-lg text-foreground">{result.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Recommended Department */}
                <div className="glass-card p-5">
                  <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" /> Recommended Department
                  </h4>
                  <Badge variant="secondary" className="text-sm px-3 py-1.5">
                    {result.recommendedDepartment}
                  </Badge>
                </div>

                {/* Possible Conditions */}
                <div className="glass-card p-5">
                  <h4 className="font-display font-semibold text-foreground mb-3">Possible Conditions</h4>
                  <div className="space-y-1.5">
                    {result.possibleConditions.map((c) => (
                      <div key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="glass-card p-5">
                <h4 className="font-display font-semibold text-foreground mb-3">Recommended Actions</h4>
                <div className="space-y-2">
                  {result.actions.map((action, i) => (
                    <div key={action} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ This is an AI-assisted prediction. Always consult a qualified healthcare professional for accurate diagnosis.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default SymptomTriagePage;
