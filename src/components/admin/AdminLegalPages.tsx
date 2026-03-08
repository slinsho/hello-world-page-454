import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, GripVertical, FileText, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LegalSection {
  icon: string;
  title: string;
  content: string;
  list?: string[];
}

const availableIcons = [
  "Scale", "Home", "Users", "Shield", "Ban", "BookOpen", "AlertTriangle",
  "RefreshCw", "Mail", "FileText", "CreditCard", "Eye", "Star",
  "MessageSquare", "Bell", "Flag", "Camera", "Clock", "ShieldCheck",
  "Database", "Lock", "Share2", "Cookie", "Baby", "Globe",
];

const TERMS_KEY = "terms_and_conditions_sections";
const PRIVACY_KEY = "privacy_policy_sections";

export function AdminLegalPages() {
  const { toast } = useToast();
  const [termsSections, setTermsSections] = useState<LegalSection[]>([]);
  const [privacySections, setPrivacySections] = useState<LegalSection[]>([]);
  const [savingTerms, setSavingTerms] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", [TERMS_KEY, PRIVACY_KEY]);

      if (data) {
        for (const row of data as any[]) {
          if (row.key === TERMS_KEY && Array.isArray(row.value)) {
            setTermsSections(row.value);
          }
          if (row.key === PRIVACY_KEY && Array.isArray(row.value)) {
            setPrivacySections(row.value);
          }
        }
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  const saveSections = async (key: string, sections: LegalSection[], setSaving: (v: boolean) => void) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value: sections as any, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) throw error;
      toast({ title: "Saved!", description: `${key === TERMS_KEY ? "Terms & Conditions" : "Privacy Policy"} updated successfully.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (
    sections: LegalSection[],
    setSections: (s: LegalSection[]) => void,
    index: number,
    field: keyof LegalSection,
    value: any
  ) => {
    const updated = [...sections];
    (updated[index] as any)[field] = value;
    setSections(updated);
  };

  const addSection = (sections: LegalSection[], setSections: (s: LegalSection[]) => void) => {
    setSections([
      ...sections,
      { icon: "FileText", title: `${sections.length + 1}. New Section`, content: "" },
    ]);
  };

  const removeSection = (sections: LegalSection[], setSections: (s: LegalSection[]) => void, index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const addListItem = (sections: LegalSection[], setSections: (s: LegalSection[]) => void, index: number) => {
    const updated = [...sections];
    if (!updated[index].list) updated[index].list = [];
    updated[index].list!.push("");
    setSections(updated);
  };

  const updateListItem = (
    sections: LegalSection[],
    setSections: (s: LegalSection[]) => void,
    sectionIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const updated = [...sections];
    updated[sectionIndex].list![itemIndex] = value;
    setSections(updated);
  };

  const removeListItem = (
    sections: LegalSection[],
    setSections: (s: LegalSection[]) => void,
    sectionIndex: number,
    itemIndex: number
  ) => {
    const updated = [...sections];
    updated[sectionIndex].list = updated[sectionIndex].list!.filter((_, i) => i !== itemIndex);
    if (updated[sectionIndex].list!.length === 0) delete updated[sectionIndex].list;
    setSections(updated);
  };

  const moveSection = (sections: LegalSection[], setSections: (s: LegalSection[]) => void, from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSections(updated);
  };

  const SectionEditor = ({
    sections,
    setSections,
    saving,
    onSave,
  }: {
    sections: LegalSection[];
    setSections: (s: LegalSection[]) => void;
    saving: boolean;
    onSave: () => void;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sections.length} section(s)</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addSection(sections, setSections)}>
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sections yet. Click "Add Section" to get started, or the page will use built-in defaults.
          </CardContent>
        </Card>
      )}

      {sections.map((section, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveSection(sections, setSections, i, i - 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === 0}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveSection(sections, setSections, i, i + 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === sections.length - 1}
                  >
                    ▼
                  </button>
                </div>
                <CardTitle className="text-sm truncate">{section.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive shrink-0"
                onClick={() => removeSection(sections, setSections, i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Icon</Label>
                <Select
                  value={section.icon}
                  onValueChange={(v) => updateSection(sections, setSections, i, "icon", v)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon} value={icon} className="text-xs">{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sections, setSections, i, "title", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Content (use double line breaks for paragraphs)</Label>
              <Textarea
                value={section.content}
                onChange={(e) => updateSection(sections, setSections, i, "content", e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>

            {/* List items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bullet Points (optional)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addListItem(sections, setSections, i)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              {section.list?.map((item, li) => (
                <div key={li} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(sections, setSections, i, li, e.target.value)}
                    className="h-8 text-xs flex-1"
                    placeholder="Bullet point text..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => removeListItem(sections, setSections, i, li)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {sections.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Pages Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit the content of your Terms & Conditions and Privacy Policy pages. Leave empty to use built-in defaults.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="terms">
        <TabsList>
          <TabsTrigger value="terms" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms & Conditions</span>
            <span className="sm:hidden">T&C</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy Policy</span>
            <span className="sm:hidden">Privacy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-4">
          <SectionEditor
            sections={termsSections}
            setSections={setTermsSections}
            saving={savingTerms}
            onSave={() => saveSections(TERMS_KEY, termsSections, setSavingTerms)}
          />
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <SectionEditor
            sections={privacySections}
            setSections={setPrivacySections}
            saving={savingPrivacy}
            onSave={() => saveSections(PRIVACY_KEY, privacySections, setSavingPrivacy)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
