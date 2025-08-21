import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  role: 'user' | 'admin' | 'editor';
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    notifications: {
      email: boolean;
      push: boolean;
      deals: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface UserActivity {
  id: string;
  userId: string;
  type: 'click' | 'view' | 'purchase' | 'signup';
  productId?: string;
  metadata: any;
  timestamp: string;
}

interface UserStats {
  totalClicks: number;
  totalPurchases: number;
  totalSavings: number;
  favoriteCategories: string[];
  lastActivity: string;
}

const userSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["user", "admin", "editor"]),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserProfiles() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/admin/users", selectedUser?.id, "stats"],
    enabled: !!selectedUser,
  });

  const { data: userActivity = [] } = useQuery<UserActivity[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "activity"],
    enabled: !!selectedUser,
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditingUser(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setIsEditingUser(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-neon-purple bg-neon-purple/20';
      case 'editor': return 'text-neon-mint bg-neon-mint/20';
      default: return 'text-gray-400 bg-gray-700/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return 'fas fa-mouse-pointer';
      case 'view': return 'fas fa-eye';
      case 'purchase': return 'fas fa-shopping-cart';
      case 'signup': return 'fas fa-user-plus';
      default: return 'fas fa-circle';
    }
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple animate-spin flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-dark-navy"></div>
          </div>
          <p className="text-white font-space">Loading Users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-space font-bold text-white">User Profiles & Management</h2>
          <p className="text-gray-400 mt-1">Manage user accounts, roles, and preferences</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
            data-testid="button-refresh-users"
          >
            <i className="fas fa-sync mr-2"></i>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Role</TableHead>
                  <TableHead className="text-gray-300">Joined</TableHead>
                  <TableHead className="text-gray-300">Last Active</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={`border-gray-700 cursor-pointer hover:bg-gray-800/50 ${
                      selectedUser?.id === user.id ? 'bg-gray-800/70' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm capitalize ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 text-sm">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUserMutation.mutate(user.id);
                          }}
                          className="text-red-400 hover:text-red-300"
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* User Details */}
        <div>
          {selectedUser ? (
            <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-700 p-6">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="profile" className="text-white">Profile</TabsTrigger>
                  <TabsTrigger value="activity" className="text-white">Activity</TabsTrigger>
                  <TabsTrigger value="preferences" className="text-white">Preferences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="text-center">
                    <img
                      src={selectedUser.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                    />
                    <h3 className="text-xl font-space font-bold text-white">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm capitalize mt-2 ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  
                  {userStats && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-neon-mint text-2xl font-bold">{userStats.totalClicks}</div>
                        <div className="text-gray-400 text-sm">Total Clicks</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-neon-purple text-2xl font-bold">{userStats.totalPurchases}</div>
                        <div className="text-gray-400 text-sm">Purchases</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 col-span-2">
                        <div className="text-warning text-2xl font-bold">${userStats.totalSavings.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">Total Savings</div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-4 mt-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {userActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                        <i className={`${getActivityIcon(activity.type)} text-neon-mint`}></i>
                        <div className="flex-1">
                          <p className="text-white text-sm capitalize">{activity.type}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Favorite Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.preferences?.categories?.map((category) => (
                          <span key={category} className="px-2 py-1 bg-neon-mint/20 text-neon-mint rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {selectedUser.preferences?.priceRange && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Price Range</h4>
                        <p className="text-gray-300">
                          ${selectedUser.preferences.priceRange.min} - ${selectedUser.preferences.priceRange.max}
                        </p>
                      </div>
                    )}
                    
                    {selectedUser.preferences?.notifications && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Notifications</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Email</span>
                            <span className={selectedUser.preferences.notifications.email ? 'text-success' : 'text-red-400'}>
                              {selectedUser.preferences.notifications.email ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Push</span>
                            <span className={selectedUser.preferences.notifications.push ? 'text-success' : 'text-red-400'}>
                              {selectedUser.preferences.notifications.push ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Deals</span>
                            <span className={selectedUser.preferences.notifications.deals ? 'text-success' : 'text-red-400'}>
                              {selectedUser.preferences.notifications.deals ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-700 p-6 text-center">
              <i className="fas fa-user-circle text-6xl text-gray-600 mb-4"></i>
              <p className="text-gray-400">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="bg-dark-navy border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white font-space">Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white">First Name</Label>
                <Input
                  {...form.register("firstName")}
                  className="bg-gray-800 border-gray-600 text-white"
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white">Last Name</Label>
                <Input
                  {...form.register("lastName")}
                  className="bg-gray-800 border-gray-600 text-white"
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                {...form.register("email")}
                type="email"
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-white">Role</Label>
              <Select onValueChange={(value) => form.setValue("role", value as "user" | "admin" | "editor")}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingUser(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy"
                data-testid="button-save-user"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}