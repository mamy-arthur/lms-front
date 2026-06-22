import { PlatformLoginForm } from "@/modules/auth/components/PlatformLoginForm";
import { GraduationCap } from "lucide-react";

export default function PlatformLoginPage() {
    return (
        <section className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md shadow-xl rounded-md p-8">
                <div className="mb-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-primary) text-white">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold">LearneO LMS</h2>
                        <p className="text-xs text-muted-foreground">
                            Learning Platform
                        </p>
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Bon retour 👋</h1>
                    <p className="mt-2 text-muted-foreground text-sm">
                        Connectez-vous à votre espace d'Administration.
                    </p>
                </div>
                <PlatformLoginForm />
            </div>
        </section>
    );
}
