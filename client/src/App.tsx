import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProjectFormModal } from './components/ProjectFormModal';
import { projectsApi, getErrorMessage } from './lib/api';
import { CreateProjectInput, ProjectWithTaskCounts } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithTaskCounts | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
    onSuccess: (newProject) => {
      toast.success(`Project "${newProject.title}" created!`);
      setIsNewProjectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProjectInput> }) =>
      projectsApi.update(id, data),
    onSuccess: (updated) => {
      toast.success(`Project "${updated.title}" updated!`);
      setProjectToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col text-slate-100">
      <Navbar onNewProject={() => setIsNewProjectOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard onNewProject={() => setIsNewProjectOpen(true)} />} />
          <Route
            path="/projects"
            element={
              <ProjectList
                onNewProject={() => setIsNewProjectOpen(true)}
                onEditProject={(p) => setProjectToEdit(p)}
              />
            }
          />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global New Project Modal */}
      {isNewProjectOpen && (
        <ProjectFormModal
          isOpen={isNewProjectOpen}
          isLoading={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setIsNewProjectOpen(false)}
        />
      )}

      {/* Global Edit Project Modal */}
      {projectToEdit && (
        <ProjectFormModal
          isOpen={!!projectToEdit}
          projectToEdit={projectToEdit}
          isLoading={updateMutation.isPending}
          onSubmit={(data) =>
            updateMutation.mutate({ id: projectToEdit.id, data })
          }
          onClose={() => setProjectToEdit(null)}
        />
      )}

      {/* Dark styled toaster */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#f8fafc',
            border: '1px solid #334155',
            fontSize: '13px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1a1d27',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a1d27',
            },
          },
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
