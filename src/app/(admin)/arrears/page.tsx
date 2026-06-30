import PlaceholderPage from "@/components/admin/PlaceholderPage";
import { Icon, TrendingUpIcon, Users } from "lucide-react";

export default function PatientsPage() {
    return (

        <div className="">
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-primary-900">ผู้ป่วยค้างชำระ</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div className={`glass-card p-5 `}>
                    <div className="flex items-start justify-between">
                        <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full `}
                        >
                            <Users className={`h-5 w-5 `} strokeWidth={2} />
                        </div>
                        <span
                            className={`flex items-center gap-0.5 text-xs font-bold `}
                        >
                            <TrendingUpIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                            350
                        </span>
                    </div>
                    <p className={`mt-4 text-sm font-medium text-muted `}>30</p>
                    <p className={`mt-1 text-3xl font-bold text-foreground `}>20</p>
                </div>
            </div>
        </div>

    );
}
