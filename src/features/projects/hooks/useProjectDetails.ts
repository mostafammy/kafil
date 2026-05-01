import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Project, Task } from '@/types';
import { toast } from 'sonner';
import JSConfetti from 'js-confetti';

export function useProjectDetails(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [freelancerQuery, setFreelancerQuery] = useState('');
  const [resolvedFreelancer, setResolvedFreelancer] = useState<{ name: string; email: string } | null>(null);
  const [payment, setPayment] = useState('');
  const [disputeTarget, setDisputeTarget] = useState<{ project: Project; task: Task } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isReleasing, setIsReleasing] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => (projectId ? api.getProject(projectId) : Promise.reject('No ID')),
    enabled: !!projectId,
    initialData: () => {
      // Try to find the project in any 'projects' list cache
      if (!projectId) return undefined;
      const allProjectsQueries = queryClient.getQueriesData<Project[]>({ queryKey: ['projects'] });
      for (const [, data] of allProjectsQueries) {
        const found = data?.find((p) => p.id === projectId);
        if (found) return found;
      }
      return undefined;
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (data: { name: string; freelancerQuery: string; payment: number }) =>
      api.addTask(projectId!, data),
    onSuccess: () => {
      toast.success(`تم إيداع الدفعة في خزنة المهمة 🔒`);
      setName('');
      setFreelancerQuery('');
      setPayment('');
      setResolvedFreelancer(null);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل إيداع الدفعة');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.completeTask(projectId!, taskId),
    onMutate: (taskId) => {
      setIsReleasing(taskId);
    },
    onSuccess: () => {
      toast.success('تم تحرير الدفعة للمستقل بنجاح ✅');
      const jsConfetti = new JSConfetti();
      jsConfetti.addConfetti({
        emojis: ['✅', '💰', '🎉', '💸'],
        emojiSize: 50,
        confettiNumber: 60,
      });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    },
    onSettled: () => {
      setIsReleasing(null);
    },
    onError: () => {
      toast.error('فشل تحرير الدفعة');
    },
  });

  const acceptTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      api.updateInviteStatus(projectId!, taskId, 'Accepted', api.getCurrentUser()?.id),
    onSuccess: () => {
      toast.success('تم قبول المهمة! بالتوفيق في العمل 🚀');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      toast.error('فشل في قبول المهمة');
    },
  });

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (projectId) {
      addTaskMutation.mutate({ name, freelancerQuery, payment: Number(payment) });
    }
  };

  const completeTask = async (taskId: string) => {
    if (!window.confirm('هل أنت متأكد من تحرير الدفعة للمستقل؟ هذا الإجراء نهائي.')) return;
    completeTaskMutation.mutate(taskId);
  };

  const acceptTask = async (taskId: string) => {
    acceptTaskMutation.mutate(taskId);
  };

  const lookupFreelancer = async (query: string) => {
    setFreelancerQuery(query);
    setResolvedFreelancer(null);
    if (query.length > 2) {
      const found = await api.lookupUser(query);
      if (found) setResolvedFreelancer({ name: found.name, email: found.email });
    }
  };

  const totalPaid = project
    ? project.tasks.filter((t) => t.paid).reduce((s, t) => s + t.payment, 0)
    : 0;
  const totalAllocated = project ? project.tasks.reduce((s, t) => s + t.payment, 0) : 0;
  const remainingBudget = project ? project.budget - totalAllocated : 0;
  const openDisputesCount = project
    ? project.tasks.filter((t) => t.status === 'Disputed').length
    : 0;

  return {
    project: project || null,
    isLoading,
    form: {
      name,
      setName,
      freelancerQuery,
      lookupFreelancer,
      resolvedFreelancer,
      payment,
      setPayment,
    },
    modals: { disputeTarget, setDisputeTarget, selectedTask, setSelectedTask },
    stats: {
      totalPaid,
      totalAllocated,
      remainingBudget,
      openDisputesCount,
      isLocking: addTaskMutation.isPending,
      isReleasing,
    },
    actions: { addTask, completeTask, acceptTask },
  };
}

