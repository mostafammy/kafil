import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  FastForward, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Rocket, 
  RefreshCcw,
  MousePointer2
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/shared/utils/cn';

interface Step {
  id: number;
  label: string;
  action: () => Promise<void>;
  icon: any;
}

export const DemoStoryRunner: FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps: Step[] = [
    { 
      id: 1, 
      label: "Client Deposits Funds", 
      icon: RefreshCcw,
      action: async () => {
        // Mock logic: Seed some balance for a client if needed
        const db = api.getDb(); 
        const client = db.users.find((u: any) => u.id === 'user_client_1');
        if (client) client.balance += 5000;
        api.saveDb(db);
      } 
    },
    { 
      id: 2, 
      label: "Project Created & Escrow Locked", 
      icon: Lock,
      action: async () => {
        const proj = await api.createProject({
          title: "Demo Fintech Product App",
          budget: 2500,
          ownerId: "user_client_1",
          category: "Software Development"
        });
        await api.addTask(proj.id, {
          name: "Smart Contract Integration",
          payment: 2500,
          freelancerQuery: "omar_dev",
          deadline: "2026-12-31"
        });
      } 
    },
    { 
      id: 3, 
      label: "Freelancer Submits Work", 
      icon: Rocket,
      action: async () => {
        const projects = await api.getProjectsByOwner("user_client_1");
        const demoProj = projects.find(p => p.title === "Demo Fintech Product App");
        if (demoProj) {
          const task = demoProj.tasks[0];
          await api.updateInviteStatus(demoProj.id, task.id, 'Accepted');
          await api.submitTaskWork(demoProj.id, task.id, {
            deliverableFile: "https://demo.kafeel.com/solution.zip",
            deliverableNote: "Finished all 12 modules. Integration tests passing."
          });
        }
      } 
    },
    { 
      id: 4, 
      label: "AI Analyst Processing", 
      icon: Cpu,
      action: async () => {
         // Simulation: just wait
         await new Promise(r => setTimeout(r, 2000));
      } 
    },
    { 
      id: 5, 
      label: "Funds Released Locally", 
      icon: CheckCircle2,
      action: async () => {
        const projects = await api.getProjectsByOwner("user_client_1");
        const demoProj = projects.find(p => p.title === "Demo Fintech Product App");
        if (demoProj) {
          const task = demoProj.tasks[0];
          await api.completeTask(demoProj.id, task.id);
        }
      } 
    }
  ];

  const handleRun = async () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setIsComplete(false);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i + 1);
      await steps[i].action();
      await new Promise(r => setTimeout(r, 2500)); // Delay between steps
    }

    setIsComplete(true);
    setIsPlaying(false);
    
    // Refresh page or trigger state update
    window.location.reload(); 
  };

  return (
    <div className="fixed bottom-10 left-10 z-[100] flex items-center gap-3">
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <Rocket size={24} className="text-white" />
      </div>
      <motion.div 
        layout
        className={cn(
          "bg-[#0D1B2A] text-white p-2 rounded-[2rem] shadow-2xl flex items-center transition-all",
          isPlaying ? "w-80" : "w-auto"
        )}
      >
        <AnimatePresence mode="wait">
          {!isPlaying ? (
            <button 
              key="start"
              onClick={handleRun}
              className="px-6 py-3 bg-[#C9A84C] text-[#0D1B2A] rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Play size={14} fill="currentColor" />
              Start Demo Story
            </button>
          ) : (
            <div key="playing" className="flex items-center gap-4 px-4 w-full">
              <div className="relative">
                 <RefreshCcw size={16} className="animate-spin text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C]">Step {currentStep}/5</div>
                <div className="text-xs font-bold leading-tight">{steps[currentStep-1]?.label}</div>
              </div>
              <MousePointer2 size={16} className="animate-bounce" />
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Line */}
      {isPlaying && (
        <div className="absolute -bottom-4 left-0 right-0 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${(currentStep/5) * 100}%` }}
             className="h-full bg-[#C9A84C]"
           />
        </div>
      )}
    </div>
  );
};
