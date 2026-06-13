import { Truck, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuLinkStyle,
} from '@/components/ui/navigation-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Header() {
  const activeTab = useAppStore((s) => s.activeTab);
  const language = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setTheme = useAppStore((s) => s.setTheme);

  const tabs = [
    { id: 'trucks' as const, label: t('tabs.trucks') },
    { id: 'pallets' as const, label: t('tabs.pallets') },
    { id: 'results' as const, label: t('tabs.results') },
  ];

  return (
    <header className="bg-card border-b border-border px-6 flex items-center sticky top-0 z-50 min-h-[56px]">
      <div className="flex items-center gap-3 flex-shrink-0 mr-8">
        <Truck className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-bold tracking-tight uppercase">LoadMaster</h1>
      </div>

      <NavigationMenu>
        <NavigationMenuList className="gap-0">
          {tabs.map((tab) => (
            <NavigationMenuItem key={tab.id}>
              <NavigationMenuLink
                data-active={activeTab === tab.id ? "" : undefined}
                onSelect={() => setActiveTab(tab.id)}
                className={navigationMenuLinkStyle()}
              >
                {tab.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <Select
          value={language}
          onValueChange={(value) => {
            if (value) setLanguage(value as 'es' | 'en');
          }}
        >
          <SelectTrigger className="h-8 w-[72px] font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">ES</SelectItem>
            <SelectItem value="en">EN</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
