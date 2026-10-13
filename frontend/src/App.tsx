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
                    <Route path="/" element={<Navigate to="/profile" replace />} />
                    <Route path="*" element={<Navigate to="/profile" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
