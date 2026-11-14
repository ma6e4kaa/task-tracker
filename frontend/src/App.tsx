import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';
import { AdminUserEditPage } from './pages/AdminUserEditPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectFormPage } from './pages/ProjectFormPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectEditPage } from './pages/ProjectEditPage';
import { TaskFormPage } from './pages/project/TaskFormPage';
import { TaskDetailPage } from './pages/project/TaskDetailPage';
import {MyTasksPage} from "./pages/MyTasksPage";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Публичные */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Защищённые — внутри Layout */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Outlet />
                                </Layout>
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/my-tasks" element={<MyTasksPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/new" element={<ProjectFormPage />} />
                        <Route path="/projects/:id" element={<ProjectDetailPage />} />
                        <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
                        <Route path="/projects/:id/tasks/new" element={<TaskFormPage />} />
                        <Route path="/projects/:id/tasks/:taskId" element={<TaskDetailPage />} />
                        <Route path="/projects/:id/tasks/:taskId/edit" element={<TaskFormPage />} />
                    </Route>

                    {/* Только для админа */}
                    <Route
                        element={
                            <AdminRoute>
                                <Layout>
                                    <Outlet />
                                </Layout>
                            </AdminRoute>
                        }
                    >
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/users/:id" element={<AdminUserEditPage />} />
                    </Route>

                    {/* Редиректы */}
                    <Route path="/" element={<Navigate to="/my-tasks" replace />} />
                    <Route path="*" element={<Navigate to="/my-tasks" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
