import React, { createContext, useContext, useEffect, useState } from 'react';

const RoadmapContext = createContext<RoadmapContextProps | undefined>(undefined);

interface Milestone {
  id: string;
  goal_id: string;
  step_number: number;
  title: string;
  description: string;
  advice: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface Goal {
  id: string;
  user_id: string;
  final_goal: string;
  near_goal: string;
  created_at: string;
}

interface RoadmapContextProps {
  goal: Goal | null;
  milestones: Milestone[];
  refresh: () => void;
  completeMilestone: (id: string) => Promise<void>;
  addComment: (id: string, comment: { coachName: string; coachRole: string; title: string; content: string; studentId: string; }) => Promise<void>;
  updateGoal: (data: { final_goal: string; near_goal: string }) => void;
}

const API_BASE = "http://localhost:3001";

export const RoadmapProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({ userId, children }) => {
  const [goal, setGoal] = useState<Goal | null>(null);

  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const updateGoal = (data: { final_goal: string; near_goal: string }) => {
    setGoal(prev => ({
      ...(prev as Goal),
      ...data,
    }));
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setGoal(data.goal);
        setMilestones(data.milestones);
      } else {
        // Fallback mock data for demo purposes
        setGoal({
          id: 'mock-goal',
          user_id: userId,
          final_goal: '体力向上',
          near_goal: '毎日30分ランニング',
          created_at: new Date().toISOString()
        });
        setMilestones([
          {
            id: 'm1',
            goal_id: 'mock-goal',
            step_number: 1,
            title: 'ストレッチ',
            description: '朝のストレッチを10分行う',
            advice: '呼吸に意識を向ける',
            is_completed: false,
            completed_at: null
          },
          {
            id: 'm2',
            goal_id: 'mock-goal',
            step_number: 2,
            title: 'ジョギング',
            description: '5kmジョギング',
            advice: 'ペースはゆっくり',
            is_completed: false,
            completed_at: null
          }
        ]);
      }
    } catch (e) {
    console.info('Roadmap data not found, using mock data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const refresh = () => fetchData();

  const completeMilestone = async (id: string) => {
    await fetch(`${API_BASE}/api/milestones/${id}/complete`, {
      method: 'PATCH',
    });
    refresh();
  };

  const addComment = async (id: string, comment: { coachName: string; coachRole: string; title: string; content: string; studentId: string; }) => {
    await fetch(`${API_BASE}/api/milestones/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
    // No immediate UI change for student view
  };

  return (
    <RoadmapContext.Provider value={{ goal, milestones, refresh, completeMilestone, addComment, updateGoal }}>
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = (): RoadmapContextProps => {
  const ctx = useContext(RoadmapContext);
  if (!ctx) throw new Error('useRoadmap must be used within RoadmapProvider');
  return ctx;
};
