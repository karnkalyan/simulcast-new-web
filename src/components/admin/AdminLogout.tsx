"use client";
import {useRouter} from "next/navigation";
import {LogOut} from "lucide-react";
export default function AdminLogout(){const router=useRouter();async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/admin/login");router.refresh()}return <button className="admin-logout" onClick={logout}><LogOut size={17}/> Sign out</button>}
