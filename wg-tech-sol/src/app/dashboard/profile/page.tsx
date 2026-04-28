"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/authStore";
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
} from "@/api/module/user";
import { toast } from "react-toastify";
import Link from "next/link";
import { Eye, EyeOff, Camera, ArrowLeft, Save } from "lucide-react";
import MagnifyText from "@/app/components/MagnifyText";

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const BASE_URL = "http://localhost:8003";
  const profileImageSrc = profilePic
    ? profilePic.startsWith("http")
      ? profilePic
      : `${BASE_URL}${profilePic}`
    : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/wgAuthForm");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.status === 200 || res.status === 201) {
        const data = res.data?.data || res.data;
        setFormData({
          fullname: data.fullname || data.username || "",
          email: data.email || "",
          password: "",
          confirmPassword: "",
        });
        setProfilePic(data.profilePicture || data.profileImage || null);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      const payload: any = {
        fullname: formData.fullname,
        email: formData.email,
      };
      if (formData.password) payload.password = formData.password;

      const res = await updateProfile(payload);
      if (res.status === 200 || res.status === 201) {
        const data = res.data?.data || res.data;
        const updatedUser = data.user || data;
        setAuth({
          token: localStorage.getItem("token")!,
          user: { ...updatedUser, profilePicture: profilePic },
        });
        toast.success("Profile updated successfully!");
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        toast.error(res.data?.message || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB allowed");
      return;
    }

    setUploadLoading(true);
    const formDataObj = new FormData();
    formDataObj.append("profilePicture", file);

    try {
      const res = await updateProfilePicture(formDataObj);
      if (res.status === 200 || res.status === 201) {
        const data = res.data?.data || res.data;
        const newPic = data.profilePicture || data.profileImage || null;
        setProfilePic(newPic);
        setAuth({
          token: localStorage.getItem("token")!,
          user: { ...user!, profilePicture: newPic },
        });
        toast.success("Profile picture updated!");
      } else {
        toast.error("Picture upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploadLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent text-white outline-none text-base placeholder-gray-600 pr-10";
  const fieldClass =
    "bg-[#0d0d0d] border border-[#222] rounded-xl p-4 focus-within:border-[#9EFF00] transition-all";

  if (isFetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9EFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-4 px-4 pb-10">
      <div className="max-w-xl mx-auto">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#9EFF00] text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-[#9EFF00] mb-8">
          <MagnifyText text="Edit Profile" />
        </h1>

        {/* Profile Picture */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full border-2 border-[#9EFF00] overflow-hidden cursor-pointer flex items-center justify-center bg-[#1a1a1a]"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadLoading ? (
                <div className="w-6 h-6 border-2 border-[#9EFF00] border-t-transparent rounded-full animate-spin" />
              ) : profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-[#9EFF00]">
                  {formData.fullname?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#9EFF00] rounded-full flex items-center justify-center hover:bg-[#8CE600] transition-all"
            >
              <Camera size={14} className="text-black" />
            </button>
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border border-[#9EFF00] text-[#9EFF00] px-4 py-2 rounded-lg text-sm hover:bg-[#9EFF00] hover:text-black transition-all font-medium"
            >
              Change Photo
            </button>
            <p className="text-gray-500 text-xs mt-1">JPG, PNG — Max 2MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePictureChange}
          />
        </div>

        {/* Form */}
        <div className="space-y-3">
          {/* Full Name */}
          <div className={fieldClass}>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
              Full Name
            </label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div className={fieldClass}>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="your@email.com"
            />
          </div>

          {/* Password */}
          <div className={fieldClass}>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
              New Password{" "}
              <span className="text-gray-600 normal-case">
                (leave blank to keep current)
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className={fieldClass}>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-3">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full mt-6 py-4 bg-[#9EFF00] text-black font-bold rounded-xl hover:bg-[#8CE600] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={18} /> Save Changes
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}







// "use client";
// import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/zustand/authStore";
// import { getProfile, updateProfile, updateProfilePicture } from "@/api/module/user";
// import { toast } from "react-toastify";
// import Link from "next/link";

// export default function ProfilePage() {
//   const { user, setAuth } = useAuthStore();
//   const router = useRouter();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [formData, setFormData] = useState({
//     fullname: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [profilePic, setProfilePic] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isFetching, setIsFetching] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/wgAuthForm"); return; }
//     fetchProfile();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       const res = await getProfile();
//       if (res.status === 200 || res.status === 201) {
//         const data = res.data?.data || res.data;
//         setFormData({
//           fullname: data.fullname || "",
//           email: data.email || "",
//           password: "",
//           confirmPassword: "",
//         });
//         setProfilePic(data.profilePicture || null);
//       }
//     } catch (err) {
//       toast.error("Failed to load profile");
//     } finally {
//       setIsFetching(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSave = async () => {
//     if (formData.password && formData.password !== formData.confirmPassword) {
//       toast.error("Passwords do not match!");
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const payload: any = {
//         fullname: formData.fullname,
//         email: formData.email,
//       };
//       if (formData.password) payload.password = formData.password;

//       const res = await updateProfile(payload);
//       if (res.status === 200 || res.status === 201) {
//         const data = res.data?.data || res.data;
//         setAuth({ token: localStorage.getItem("token")!, user: data.user || data });
//         toast.success("Profile updated successfully!");
//         setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
//       } else {
//         toast.error(res.data?.message || "Update failed");
//       }
//     } catch (err) {
//       toast.error("Something went wrong");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const formDataObj = new FormData();
//     formDataObj.append("profilePicture", file);

//     try {
//       const res = await updateProfilePicture(formDataObj);
//       if (res.status === 200 || res.status === 201) {
//         const data = res.data?.data || res.data;
//         setProfilePic(data.profilePicture);
//         toast.success("Profile picture updated!");
//       } else {
//         toast.error("Picture upload failed");
//       }
//     } catch (err) {
//       toast.error("Upload error");
//     }
//   };

//   if (isFetching) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center">
//         <div className="text-[#9EFF00] text-xl">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-black text-white pt-28 px-4">
//       <div className="max-w-2xl mx-auto">

//         {/* Back */}
//         <Link href="/dashboard" className="text-gray-400 hover:text-[#9EFF00] text-sm mb-6 inline-block">
//           ← Back to Dashboard
//         </Link>

//         <h1 className="text-4xl font-bold text-[#9EFF00] mb-8">Edit Profile</h1>

//         {/* Profile Picture */}
//         <div className="flex items-center gap-6 mb-8">
//           <div
//             className="w-24 h-24 rounded-full border-2 border-[#9EFF00] overflow-hidden cursor-pointer flex items-center justify-center bg-[#1a1a1a]"
//             onClick={() => fileInputRef.current?.click()}
//           >
//             {profilePic ? (
//               <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
//             ) : (
//               <span className="text-4xl font-bold text-[#9EFF00]">
//                 {formData.fullname?.charAt(0)?.toUpperCase() || "U"}
//               </span>
//             )}
//           </div>
//           <div>
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="border border-[#9EFF00] text-[#9EFF00] px-4 py-2 rounded-lg text-sm hover:bg-[#9EFF00] hover:text-black transition-all"
//             >
//               Change Photo
//             </button>
//             <p className="text-gray-500 text-xs mt-1">JPG, PNG — Max 2MB</p>
//           </div>
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             className="hidden"
//             onChange={handlePictureChange}
//           />
//         </div>

//         {/* Form */}
//         <div className="space-y-4">

//           {/* Full Name */}
//           <div className="bg-[#111] border border-[#333] rounded-xl p-5">
//             <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
//             <input
//               type="text"
//               name="fullname"
//               value={formData.fullname}
//               onChange={handleChange}
//               className="w-full bg-transparent text-white outline-none text-lg placeholder-gray-600"
//               placeholder="Your full name"
//             />
//           </div>

//           {/* Email */}
//           <div className="bg-[#111] border border-[#333] rounded-xl p-5">
//             <label className="text-gray-400 text-sm mb-2 block">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               className="w-full bg-transparent text-white outline-none text-lg placeholder-gray-600"
//               placeholder="your@email.com"
//             />
//           </div>

//           {/* New Password */}
//           <div className="bg-[#111] border border-[#333] rounded-xl p-5">
//             <label className="text-gray-400 text-sm mb-2 block">New Password <span className="text-gray-600">(leave blank to keep current)</span></label>
//             <input
//               type="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               className="w-full bg-transparent text-white outline-none text-lg placeholder-gray-600"
//               placeholder="••••••••"
//             />
//           </div>

//           {/* Confirm Password */}
//           <div className="bg-[#111] border border-[#333] rounded-xl p-5">
//             <label className="text-gray-400 text-sm mb-2 block">Confirm Password</label>
//             <input
//               type="password"
//               name="confirmPassword"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               className="w-full bg-transparent text-white outline-none text-lg placeholder-gray-600"
//               placeholder="••••••••"
//             />
//           </div>

//         </div>

//         {/* Save Button */}
//         <div className="mt-8">
//           <button
//             onClick={handleSave}
//             disabled={isLoading}
//             className="w-full py-4 bg-[#9EFF00] text-black font-bold text-lg rounded-xl hover:bg-[#8CE600] transition-all disabled:opacity-50"
//           >
//             {isLoading ? "Saving..." : "Save Changes"}
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// }

// export default Profile;