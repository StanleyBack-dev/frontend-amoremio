import { useNavigate } from "react-router-dom";
import SectionCard from "@/components/organisms/SectionCard";
import SettingsLinkItem from "@molecules/SettingsLinkItem";
import { settingsPageItems, viewTitles, getPathForView } from "@/router/navigation";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <SectionCard
        title="Configurações"
        description="Informações e documentos do sistema."
      >
        <div className="space-y-3">
          {settingsPageItems.map((item) => (
            <SettingsLinkItem
              key={item.id}
              icon={item.icon}
              title={item.label}
              description={viewTitles[item.id].subtitle}
              onClick={() => navigate(getPathForView(item.id))}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
