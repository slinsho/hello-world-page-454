import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Property {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price_usd: number;
  status: string;
  county: string;
  owner_id: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProperties = async () => {
    const { data: propertiesData, error: propertiesError } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (propertiesError || !propertiesData) return;

    const ownerIds = [...new Set(propertiesData.map(p => p.owner_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", ownerIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const enrichedProperties = propertiesData.map(property => ({
      ...property,
      profiles: profilesMap.get(property.owner_id) || null,
    }));

    setProperties(enrichedProperties as Property[]);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (propertyId: string) => {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Property deleted successfully",
    });

    setDeletePropertyId(null);
    fetchProperties();
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.county.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredProperties.map((property) => (
          <Card key={property.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Owner: {property.profiles?.name || 'Unknown'}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{property.property_type}</Badge>
                    <Badge variant="secondary">{property.listing_type}</Badge>
                    <Badge
                      variant={
                        property.status === "active"
                          ? "default"
                          : property.status === "taken"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {property.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">
                    ${property.price_usd.toLocaleString()} • {property.county}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeletePropertyId(property.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={deletePropertyId !== null}
        onOpenChange={() => setDeletePropertyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              property listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePropertyId && handleDelete(deletePropertyId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
