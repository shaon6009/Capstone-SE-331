import { useNavigate } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
import { signOut } from "@/lib/mockStore";

interface NavbarProps {
  anonName: string;
}

const Navbar = ({ anonName }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <h1 className="text-xl font-bold text-primary">FixMyCampus</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{anonName}</span>
        <button className="rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors">
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={handleLogout}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
