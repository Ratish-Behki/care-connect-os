import { motion } from 'framer-motion';
import { FileText, Activity, Pill } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { recordService } from '@/services/recordService';

const RecordsPage = () => {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records'],
    queryFn: recordService.getRecords,
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Medical Records</h1>
          <p className="text-sm text-muted-foreground mt-1">Your complete health history</p>
        </div>

        {isLoading ? (
          <div className="glass-card p-8 text-center text-sm text-muted-foreground">Loading records...</div>
        ) : (
          <div className="space-y-4">
          {records.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{record.diagnosis}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{record.doctorName} • {record.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{record.notes}</p>
                  {record.prescriptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.prescriptions.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                          <Pill className="w-3 h-3" /> {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecordsPage;
