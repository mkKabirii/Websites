"use client";
import { useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  getAllServices,
  getSubServicesbyServiceId,
} from "@/api/module/service";
import { createProposal } from "@/api/module/proposals";
import TermsModal from "@/app/wgContactForm/TermsModal";
import type {
  Service,
  SubService,
  SelectedServiceItem,
  ProposalPayload,
} from "./ContactForm.types";
import MagnifyText from "@/app/components/MagnifyText";
import { Loader2, Paperclip, X } from "lucide-react";

export default function ContactForm() {
  const searchParams = useSearchParams();
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [budget, setBudget] = useState(1000);
  const [message, setMessage] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedSubServiceId, setSelectedSubServiceId] = useState("");
  const [selectedServices, setSelectedServices] = useState<
    SelectedServiceItem[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSubServices, setIsLoadingSubServices] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [nationalId, setNationalId] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [manualBudget, setManualBudget] = useState<string>("");

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchSubServices(selectedServiceId);
    } else {
      setSubServices([]);
      setSelectedSubServiceId("");
    }
  }, [selectedServiceId]);

  useEffect(() => {
    const serviceId = searchParams.get("serviceId");
    if (serviceId && services.length > 0 && !selectedServiceId) {
      const service = services.find((s) => s._id === serviceId);
      if (service) setSelectedServiceId(serviceId);
    }
  }, [services, searchParams, selectedServiceId]);

  useEffect(() => {
    const subServiceId = searchParams.get("subServiceId");
    if (
      subServiceId &&
      subServices.length > 0 &&
      selectedServiceId &&
      !selectedSubServiceId
    ) {
      const subService = subServices.find((s) => s._id === subServiceId);
      const service = services.find((s) => s._id === selectedServiceId);

      if (subService && service) {
        setSelectedSubServiceId(subServiceId);

        const serviceItem: SelectedServiceItem = {
          serviceId: selectedServiceId,
          serviceName: service.title,
          subServiceId: subServiceId,
          subServiceName: subService.title,
          displayText: `${service.title} - ${subService.title}`,
        };

        setSelectedServices((prev) => {
          const exists = prev.some(
            (item) =>
              item.serviceId === serviceItem.serviceId &&
              item.subServiceId === serviceItem.subServiceId,
          );
          return exists ? prev : [...prev, serviceItem];
        });
      }
    }
  }, [subServices, selectedServiceId, selectedSubServiceId, services, searchParams]);

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await getAllServices();
      if (response.status === 200 || response.status === 201) {
        const servicesData: Service[] = response?.data?.data?.services || [];
        setServices(servicesData);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error loading services");
    } finally {
      setIsLoadingServices(false);
    }
  };

  const fetchSubServices = async (serviceId: string) => {
    setIsLoadingSubServices(true);
    try {
      const response = await getSubServicesbyServiceId(serviceId);
      if (response.status === 200 || response.status === 201) {
        const subServicesData: SubService[] = response?.data?.data || [];
        setSubServices(subServicesData);
      } else {
        toast.error("Failed to load sub-services");
        setSubServices([]);
      }
    } catch (error) {
      console.error("Error fetching sub-services:", error);
      toast.error("Error loading sub-services");
      setSubServices([]);
    } finally {
      setIsLoadingSubServices(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedSubServiceId("");
  };

  const handleSubServiceChange = (subServiceId: string) => {
    setSelectedSubServiceId(subServiceId);

    if (selectedServiceId && subServiceId) {
      const selectedService = services.find((s) => s._id === selectedServiceId);
      const selectedSubService = subServices.find((s) => s._id === subServiceId);

      if (selectedService && selectedSubService) {
        const serviceItem: SelectedServiceItem = {
          serviceId: selectedServiceId,
          serviceName: selectedService.title,
          subServiceId: subServiceId,
          subServiceName: selectedSubService.title,
          displayText: `${selectedService.title} - ${selectedSubService.title}`,
        };

        const exists = selectedServices.some(
          (item) =>
            item.serviceId === serviceItem.serviceId &&
            item.subServiceId === serviceItem.subServiceId,
        );

        if (!exists) {
          setSelectedServices([...selectedServices, serviceItem]);
        }
      }
    }
  };

  const removeServiceChip = (indexToRemove: number) => {
    setSelectedServices(
      selectedServices.filter((_, index) => index !== indexToRemove),
    );
  };

  const validateForm = (): boolean => {
    if (!fullname.trim() || fullname.trim().length < 3) {
      toast.error("Full name must be at least 3 characters");
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!password.trim() || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (!nationalId.trim()) {
      toast.error("National ID Number is required");
      return false;
    }
    if (!termsAccepted) {
      toast.error("Please accept the Terms and Conditions");
      return false;
    }
    if (selectedServices.length === 0) {
      toast.error("Please select at least one service.");
      return false;
    }
    return true;
  };

  const buildPayload = (): ProposalPayload => {
    const payload: ProposalPayload = {
      fullname: fullname.trim(),
      email: email.trim(),
      password: password.trim(),
    };

    if (selectedServices.length > 0) {
      payload.services = [...new Set(selectedServices.map((item) => item.serviceId))];
      payload.subServices = selectedServices.map((item) => item.subServiceId);
    }

    payload.budget = manualBudget
      ? manualBudget
      : budget
        ? budget.toString()
        : null;
    payload.messages = message.trim() || null;
    payload.nationalId = nationalId.trim() || null;
    payload.document = document || null;

    return payload;
  };

  const resetForm = () => {
    setFullname("");
    setEmail("");
    setPassword("");
    setBudget(1000);
    setMessage("");
    setSelectedServiceId("");
    setSelectedSubServiceId("");
    setSelectedServices([]);
    setSubServices([]);
    setTermsAccepted(false);
    setNationalId("");
    setDocument(null);
    setManualBudget("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const response = await createProposal(payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Proposal submitted successfully!");
        resetForm();
      } else {
        toast.error(response.data?.message || "Failed to submit proposal");
      }
    } catch (error: unknown) {
      console.error("Submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred while submitting";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern input classes
  const labelClass = "text-gray-400 text-xs font-medium mb-1.5 block uppercase tracking-wider";
  const inputClass = "w-full bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#9EFF00] focus:shadow-[0_0_15px_rgba(158,255,0,0.15)] transition-all placeholder-gray-600 text-sm";
  const selectClass = "w-full bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-[#9EFF00] focus:shadow-[0_0_15px_rgba(158,255,0,0.15)] transition-all appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  return (
    <div className="min-h-auto mt-26 sm:mt-16 md:mt-24 flex items-center justify-center px-4 sm:px-6 lg:px-8 mb-20 relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#9EFF00] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9EFF00] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[840px] border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-8 sm:p-10 md:p-12 space-y-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-3">
            <MagnifyText text="Start Your Project" />
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
            Fill out the details below and let's build something extraordinary together.
          </p>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>
              Full Name <span className="text-[#9EFF00]">*</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
              minLength={3}
              maxLength={120}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Email Address <span className="text-[#9EFF00]">*</span>
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Password & ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>
              Account Password <span className="text-[#9EFF00]">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              National ID Number <span className="text-[#9EFF00]">*</span>
            </label>
            <input
              type="text"
              placeholder="00000-0000000-0"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              maxLength={20}
              className={inputClass}
            />
          </div>
        </div>

        {/* Services Dropdowns */}
        <div>
          <label className={labelClass}>
            Select Services <span className="text-[#9EFF00]">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                disabled={isLoadingServices}
                className={selectClass}
              >
                <option value="">
                  {isLoadingServices ? "Loading..." : "Choose service..."}
                </option>
                {services.map((service) => (
                  <option key={service._id} value={service._id} className="bg-[#1a1a1a] text-white">
                    {service.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 group-hover:text-[#9EFF00] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div className="flex-1 relative group">
              <select
                value={selectedSubServiceId}
                onChange={(e) => handleSubServiceChange(e.target.value)}
                disabled={!selectedServiceId || isLoadingSubServices}
                className={selectClass}
              >
                <option value="">
                  {isLoadingSubServices
                    ? "Loading..."
                    : !selectedServiceId
                      ? "Select service first..."
                      : "Choose sub-service..."}
                </option>
                {subServices.map((subService) => (
                  <option key={subService._id} value={subService._id} className="bg-[#1a1a1a] text-white">
                    {subService.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 group-hover:text-[#9EFF00] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Services Chips */}
        {selectedServices.length > 0 && (
          <div className="p-4 rounded-xl border border-[#9EFF00]/20 bg-[#9EFF00]/5 flex flex-wrap gap-2">
            {selectedServices.map((serviceItem, index) => (
              <div
                key={index}
                className="bg-[#9EFF00] text-black px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-[0_0_10px_rgba(158,255,0,0.2)]"
              >
                <span>{serviceItem.displayText}</span>
                <button
                  type="button"
                  onClick={() => removeServiceChip(index)}
                  className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Budget */}
        <div>
          <label className={labelClass}>Your Budget</label>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 shadow-sm transition-all hover:border-[rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-gray-400 text-xs font-medium">$500</span>
              <div className="flex-1 px-2">
                <input
                  type="range"
                  min={500}
                  max={50000}
                  value={budget}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBudget(Number(e.target.value))
                  }
                  className="w-full accent-[#9EFF00] cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none outline-none"
                  style={{
                    background: `linear-gradient(to right, #9EFF00 0%, #9EFF00 ${((budget - 500) / (50000 - 500)) * 100}%, #333 ${((budget - 500) / (50000 - 500)) * 100}%, #333 100%)`,
                  }}
                />
              </div>
              <span className="text-gray-400 text-xs font-medium">$50k+</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[#9EFF00] font-bold text-lg tracking-wide bg-[#9EFF00]/10 px-4 py-1.5 rounded-lg border border-[#9EFF00]/20">
                ${budget.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-gray-500 text-xs uppercase tracking-wider">Or enter manually</span>
                <div className="flex items-center gap-1 border-b border-gray-700 focus-within:border-[#9EFF00] transition-colors pb-1">
                  <span className="text-[#9EFF00] font-medium text-sm">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={manualBudget}
                    min={0}
                    onChange={(e) => {
                      setManualBudget(e.target.value);
                      if (e.target.value) setBudget(Number(e.target.value));
                    }}
                    className="w-20 bg-transparent outline-none text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className={labelClass}>Project Description</label>
          <textarea
            placeholder="Tell us about your requirements..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} resize-none min-h-[120px]`}
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className={labelClass}>Upload Document <span className="text-gray-500 normal-case">(Optional)</span></label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer group relative overflow-hidden rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.07)] px-5 py-3.5 hover:border-[#9EFF00]/50 transition-all">
              <div className="flex items-center gap-2 relative z-10">
                <Paperclip size={16} className="text-gray-400 group-hover:text-[#9EFF00] transition-colors" />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {document ? document.name : "Attach File"}
                </span>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setDocument(e.target.files?.[0] || null)}
              />
              <div className="absolute inset-0 bg-[#9EFF00]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </label>
            {document && (
              <button
                type="button"
                onClick={() => setDocument(null)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, DOC, DOCX</p>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#141414]/50 cursor-pointer group hover:bg-[#141414] transition-colors">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
              className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded cursor-pointer checked:bg-[#9EFF00] checked:border-[#9EFF00] transition-colors"
            />
            <svg
              className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-gray-400 leading-snug">
            By submitting this proposal, I acknowledge that I have read and agree to the{" "}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }}
              className="text-[#9EFF00] hover:text-white underline decoration-[#9EFF00]/50 underline-offset-4 transition-colors font-medium"
            >
              Terms & Conditions
            </button>
            {" "}of WG Tech Solutions.
          </span>
        </label>

        <TermsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !termsAccepted}
            className="w-full relative overflow-hidden rounded-xl bg-[#9EFF00] text-black font-bold text-sm tracking-widest uppercase py-4 shadow-[0_0_20px_rgba(158,255,0,0.2)] hover:shadow-[0_0_30px_rgba(158,255,0,0.4)] hover:bg-[#a8ff1a] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Proposal"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
