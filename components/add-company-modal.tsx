"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AddCompanyModalProps {
  referenceid: string;
  onCreated: () => Promise<void>;
}

export function AddCompanyModal({
  referenceid,
  onCreated,
}: AddCompanyModalProps) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    tsm: "",
    company_name: "",
    contact_person: "",
    contact_number: "", // ← joined string
    email_address: "",
    address: "",
    industry: "",
    type_client: "New Client",
    manager: null,
    region: null,
    company_group: null,
    status: "Active",
  });

  // ✅ MULTIPLE CONTACT NUMBERS STATE with country code
  interface ContactNumber {
    countryCode: string;
    number: string;
  }
  const [contactNumbers, setContactNumbers] = useState<ContactNumber[]>([{ countryCode: "+63", number: "" }]);

  // Country codes list (PH first, then all other countries A-Z)
  const countryCodes = [
    { code: "+63", country: "Philippines", flag: "🇵🇭" },
    { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
    { code: "+355", country: "Albania", flag: "🇦🇱" },
    { code: "+213", country: "Algeria", flag: "🇩🇿" },
    { code: "+1-684", country: "American Samoa", flag: "🇦🇸" },
    { code: "+376", country: "Andorra", flag: "🇦🇩" },
    { code: "+244", country: "Angola", flag: "🇦🇴" },
    { code: "+1-264", country: "Anguilla", flag: "🇦🇮" },
    { code: "+672", country: "Antarctica", flag: "🇦🇶" },
    { code: "+1-268", country: "Antigua and Barbuda", flag: "🇦🇬" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    { code: "+374", country: "Armenia", flag: "🇦🇲" },
    { code: "+297", country: "Aruba", flag: "🇦🇼" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+43", country: "Austria", flag: "🇦🇹" },
    { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
    { code: "+1-242", country: "Bahamas", flag: "🇧🇸" },
    { code: "+973", country: "Bahrain", flag: "🇧🇭" },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
    { code: "+1-246", country: "Barbados", flag: "🇧🇧" },
    { code: "+375", country: "Belarus", flag: "🇧🇾" },
    { code: "+32", country: "Belgium", flag: "🇧🇪" },
    { code: "+501", country: "Belize", flag: "🇧🇿" },
    { code: "+229", country: "Benin", flag: "🇧🇯" },
    { code: "+1-441", country: "Bermuda", flag: "🇧🇲" },
    { code: "+975", country: "Bhutan", flag: "🇧🇹" },
    { code: "+591", country: "Bolivia", flag: "🇧🇴" },
    { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
    { code: "+267", country: "Botswana", flag: "🇧🇼" },
    { code: "+47", country: "Bouvet Island", flag: "🇧🇻" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+246", country: "British Indian Ocean Territory", flag: "🇮🇴" },
    { code: "+1-284", country: "British Virgin Islands", flag: "🇻🇬" },
    { code: "+673", country: "Brunei", flag: "🇧🇳" },
    { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
    { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
    { code: "+257", country: "Burundi", flag: "🇧🇮" },
    { code: "+855", country: "Cambodia", flag: "🇰🇭" },
    { code: "+237", country: "Cameroon", flag: "🇨🇲" },
    { code: "+1", country: "Canada", flag: "🇨🇦" },
    { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
    { code: "+1-345", country: "Cayman Islands", flag: "🇰🇾" },
    { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
    { code: "+235", country: "Chad", flag: "🇹🇩" },
    { code: "+56", country: "Chile", flag: "🇨🇱" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+61", country: "Christmas Island", flag: "🇨🇽" },
    { code: "+61", country: "Cocos Islands", flag: "🇨🇨" },
    { code: "+57", country: "Colombia", flag: "🇨🇴" },
    { code: "+269", country: "Comoros", flag: "🇰🇲" },
    { code: "+682", country: "Cook Islands", flag: "🇨🇰" },
    { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
    { code: "+385", country: "Croatia", flag: "🇭🇷" },
    { code: "+53", country: "Cuba", flag: "🇨🇺" },
    { code: "+599", country: "Curacao", flag: "🇨🇼" },
    { code: "+357", country: "Cyprus", flag: "🇨🇾" },
    { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
    { code: "+243", country: "Democratic Republic of the Congo", flag: "🇨🇩" },
    { code: "+45", country: "Denmark", flag: "🇩🇰" },
    { code: "+253", country: "Djibouti", flag: "🇩🇯" },
    { code: "+1-767", country: "Dominica", flag: "🇩🇲" },
    { code: "+1-809", country: "Dominican Republic", flag: "🇩🇴" },
    { code: "+670", country: "East Timor", flag: "🇹🇱" },
    { code: "+593", country: "Ecuador", flag: "🇪🇨" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+503", country: "El Salvador", flag: "🇸🇻" },
    { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
    { code: "+291", country: "Eritrea", flag: "🇪🇷" },
    { code: "+372", country: "Estonia", flag: "🇪🇪" },
    { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
    { code: "+500", country: "Falkland Islands", flag: "🇫🇰" },
    { code: "+298", country: "Faroe Islands", flag: "🇫🇴" },
    { code: "+679", country: "Fiji", flag: "🇫🇯" },
    { code: "+358", country: "Finland", flag: "🇫🇮" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+689", country: "French Polynesia", flag: "🇵🇫" },
    { code: "+262", country: "French Southern Territories", flag: "🇹🇫" },
    { code: "+241", country: "Gabon", flag: "🇬🇦" },
    { code: "+220", country: "Gambia", flag: "🇬🇲" },
    { code: "+995", country: "Georgia", flag: "🇬🇪" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+350", country: "Gibraltar", flag: "🇬🇮" },
    { code: "+30", country: "Greece", flag: "🇬🇷" },
    { code: "+299", country: "Greenland", flag: "🇬🇱" },
    { code: "+1-473", country: "Grenada", flag: "🇬🇩" },
    { code: "+1-671", country: "Guam", flag: "🇬🇺" },
    { code: "+502", country: "Guatemala", flag: "🇬🇹" },
    { code: "+44-1481", country: "Guernsey", flag: "🇬🇬" },
    { code: "+224", country: "Guinea", flag: "🇬🇳" },
    { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
    { code: "+592", country: "Guyana", flag: "🇬🇾" },
    { code: "+509", country: "Haiti", flag: "🇭🇹" },
    { code: "+504", country: "Honduras", flag: "🇭🇳" },
    { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
    { code: "+36", country: "Hungary", flag: "🇭🇺" },
    { code: "+354", country: "Iceland", flag: "🇮🇸" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+62", country: "Indonesia", flag: "🇮🇩" },
    { code: "+98", country: "Iran", flag: "🇮🇷" },
    { code: "+964", country: "Iraq", flag: "🇮🇶" },
    { code: "+353", country: "Ireland", flag: "🇮🇪" },
    { code: "+44-1624", country: "Isle of Man", flag: "🇮🇲" },
    { code: "+972", country: "Israel", flag: "🇮🇱" },
    { code: "+39", country: "Italy", flag: "🇮🇹" },
    { code: "+1-876", country: "Jamaica", flag: "🇯🇲" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+44-1534", country: "Jersey", flag: "🇯🇪" },
    { code: "+962", country: "Jordan", flag: "🇯🇴" },
    { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+686", country: "Kiribati", flag: "🇰🇮" },
    { code: "+383", country: "Kosovo", flag: "🇽🇰" },
    { code: "+965", country: "Kuwait", flag: "🇰🇼" },
    { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
    { code: "+856", country: "Laos", flag: "🇱🇦" },
    { code: "+371", country: "Latvia", flag: "🇱🇻" },
    { code: "+961", country: "Lebanon", flag: "🇱🇧" },
    { code: "+266", country: "Lesotho", flag: "🇱🇸" },
    { code: "+231", country: "Liberia", flag: "🇱🇷" },
    { code: "+218", country: "Libya", flag: "🇱🇾" },
    { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
    { code: "+370", country: "Lithuania", flag: "🇱🇹" },
    { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
    { code: "+853", country: "Macau", flag: "🇲🇴" },
    { code: "+261", country: "Madagascar", flag: "🇲🇬" },
    { code: "+265", country: "Malawi", flag: "🇲🇼" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+960", country: "Maldives", flag: "🇲🇻" },
    { code: "+223", country: "Mali", flag: "🇲🇱" },
    { code: "+356", country: "Malta", flag: "🇲🇹" },
    { code: "+692", country: "Marshall Islands", flag: "🇲🇭" },
    { code: "+222", country: "Mauritania", flag: "🇲🇷" },
    { code: "+230", country: "Mauritius", flag: "🇲🇺" },
    { code: "+262", country: "Mayotte", flag: "🇾🇹" },
    { code: "+52", country: "Mexico", flag: "🇲🇽" },
    { code: "+691", country: "Micronesia", flag: "🇫🇲" },
    { code: "+373", country: "Moldova", flag: "🇲🇩" },
    { code: "+377", country: "Monaco", flag: "🇲🇨" },
    { code: "+976", country: "Mongolia", flag: "🇲🇳" },
    { code: "+382", country: "Montenegro", flag: "🇲🇪" },
    { code: "+1-664", country: "Montserrat", flag: "🇲🇸" },
    { code: "+212", country: "Morocco", flag: "🇲🇦" },
    { code: "+258", country: "Mozambique", flag: "🇲🇿" },
    { code: "+95", country: "Myanmar", flag: "🇲🇲" },
    { code: "+264", country: "Namibia", flag: "🇳🇦" },
    { code: "+674", country: "Nauru", flag: "🇳🇷" },
    { code: "+977", country: "Nepal", flag: "🇳🇵" },
    { code: "+31", country: "Netherlands", flag: "🇳🇱" },
    { code: "+687", country: "New Caledonia", flag: "🇳🇨" },
    { code: "+64", country: "New Zealand", flag: "🇳🇿" },
    { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
    { code: "+227", country: "Niger", flag: "🇳🇪" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+683", country: "Niue", flag: "🇳🇺" },
    { code: "+672", country: "Norfolk Island", flag: "🇳🇫" },
    { code: "+850", country: "North Korea", flag: "🇰🇵" },
    { code: "+1-670", country: "Northern Mariana Islands", flag: "🇲🇵" },
    { code: "+47", country: "Norway", flag: "🇳🇴" },
    { code: "+968", country: "Oman", flag: "🇴🇲" },
    { code: "+92", country: "Pakistan", flag: "🇵🇰" },
    { code: "+680", country: "Palau", flag: "🇵🇼" },
    { code: "+970", country: "Palestine", flag: "🇵🇸" },
    { code: "+507", country: "Panama", flag: "🇵🇦" },
    { code: "+675", country: "Papua New Guinea", flag: "🇵🇬" },
    { code: "+595", country: "Paraguay", flag: "🇵🇾" },
    { code: "+51", country: "Peru", flag: "🇵🇪" },
    { code: "+48", country: "Poland", flag: "🇵🇱" },
    { code: "+351", country: "Portugal", flag: "🇵🇹" },
    { code: "+1-787", country: "Puerto Rico", flag: "🇵🇷" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+242", country: "Republic of the Congo", flag: "🇨🇬" },
    { code: "+262", country: "Reunion", flag: "🇷🇪" },
    { code: "+40", country: "Romania", flag: "🇷🇴" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
    { code: "+250", country: "Rwanda", flag: "🇷🇼" },
    { code: "+590", country: "Saint Barthelemy", flag: "🇧🇱" },
    { code: "+290", country: "Saint Helena", flag: "🇸🇭" },
    { code: "+1-869", country: "Saint Kitts and Nevis", flag: "🇰🇳" },
    { code: "+1-758", country: "Saint Lucia", flag: "🇱🇨" },
    { code: "+590", country: "Saint Martin", flag: "🇲🇫" },
    { code: "+508", country: "Saint Pierre and Miquelon", flag: "🇵🇲" },
    { code: "+1-784", country: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
    { code: "+685", country: "Samoa", flag: "🇼🇸" },
    { code: "+378", country: "San Marino", flag: "🇸🇲" },
    { code: "+239", country: "Sao Tome and Principe", flag: "🇸🇹" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
    { code: "+381", country: "Serbia", flag: "🇷🇸" },
    { code: "+248", country: "Seychelles", flag: "🇸🇨" },
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+1-721", country: "Sint Maarten", flag: "🇸🇽" },
    { code: "+421", country: "Slovakia", flag: "🇸🇰" },
    { code: "+386", country: "Slovenia", flag: "🇸🇮" },
    { code: "+677", country: "Solomon Islands", flag: "🇸🇧" },
    { code: "+252", country: "Somalia", flag: "🇸🇴" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+82", country: "South Korea", flag: "🇰🇷" },
    { code: "+211", country: "South Sudan", flag: "🇸🇸" },
    { code: "+34", country: "Spain", flag: "🇪🇸" },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
    { code: "+249", country: "Sudan", flag: "🇸🇩" },
    { code: "+597", country: "Suriname", flag: "🇸🇷" },
    { code: "+47", country: "Svalbard and Jan Mayen", flag: "🇸🇯" },
    { code: "+268", country: "Swaziland", flag: "🇸🇿" },
    { code: "+46", country: "Sweden", flag: "🇸🇪" },
    { code: "+41", country: "Switzerland", flag: "🇨🇭" },
    { code: "+963", country: "Syria", flag: "🇸🇾" },
    { code: "+886", country: "Taiwan", flag: "🇹🇼" },
    { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
    { code: "+255", country: "Tanzania", flag: "🇹🇿" },
    { code: "+66", country: "Thailand", flag: "🇹🇭" },
    { code: "+228", country: "Togo", flag: "🇹🇬" },
    { code: "+690", country: "Tokelau", flag: "🇹🇰" },
    { code: "+676", country: "Tonga", flag: "🇹🇴" },
    { code: "+1-868", country: "Trinidad and Tobago", flag: "🇹🇹" },
    { code: "+216", country: "Tunisia", flag: "🇹🇳" },
    { code: "+90", country: "Turkey", flag: "🇹🇷" },
    { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
    { code: "+1-649", country: "Turks and Caicos Islands", flag: "🇹🇨" },
    { code: "+688", country: "Tuvalu", flag: "🇹🇻" },
    { code: "+1-340", country: "U.S. Virgin Islands", flag: "🇻🇮" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
    { code: "+380", country: "Ukraine", flag: "🇺🇦" },
    { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
    { code: "+1", country: "United States", flag: "🇺🇸" },
    { code: "+598", country: "Uruguay", flag: "🇺🇾" },
    { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
    { code: "+678", country: "Vanuatu", flag: "🇻🇺" },
    { code: "+379", country: "Vatican", flag: "🇻🇦" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },
    { code: "+84", country: "Vietnam", flag: "🇻🇳" },
    { code: "+681", country: "Wallis and Futuna", flag: "🇼🇫" },
    { code: "+212", country: "Western Sahara", flag: "🇪🇭" },
    { code: "+967", country: "Yemen", flag: "🇾🇪" },
    { code: "+260", country: "Zambia", flag: "🇿🇲" },
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  ];
  const [emailAddresses, setEmailAddresses] = useState<string[]>([""]);

  // names
  const [contactPersons, setContactPersons] = useState<
    { title: string; name: string }[]
  >([{ title: "Mr.", name: "" }]);

  const [existingCompanies, setExistingCompanies] = useState<
    {
      company_name: string;
      contact_person: string;
      contact_number: string;
      email_address: string;
    }[]
  >([]);

  const [duplicate, setDuplicate] = useState({ contact: false });
  const [companyExists, setCompanyExists] = useState(false);

  /* CLIENT SEGMENT (HARDCODED) */
  const clientSegments = [
    "Technology / Manufacturing / Telco / Data Center/ Agriculture",
    "Healthcare/ Education - Private",
    "Construction/ Real Estate",
    "Energy / Mining",
    "Finance/ Commercial/ Hospitality/ Retail",
    "Government / LGU - Retrofit",
    "Government/ Infra",
    "Trading / Individual - Reseller/ Dealer/Influencer/ End User",
    "Distributorship",
    "Transportation",
  ];
  const genders = ["Male", "Female"];

  /* FETCH EXISTING COMPANIES */
  useEffect(() => {
    if (open) {
      fetch("/api/com-fetch-account")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setExistingCompanies(
              data.data.map((c: any) => ({
                company_name: (c.company_name ?? "").toLowerCase().trim(),
                contact_person: (c.contact_person ?? "").toLowerCase().trim(),
                contact_number: (c.contact_number ?? "").toLowerCase().trim(),
                email_address: (c.email_address ?? "").toLowerCase().trim(),
              })),
            );
          }
        });
    }
  }, [open]);

  /* DUPLICATE CHECK */
  useEffect(() => {
    const name = formData.company_name.toLowerCase().trim();

    const person = contactPersons
      .map((p) => `${p.title} ${p.name}`.toLowerCase().trim())
      .filter(Boolean)
      .join(", ");

    const numbers = contactNumbers
      .map((n) => `${n.countryCode} ${n.number}`.toLowerCase().trim())
      .filter((n) => n.replace(/\+\d+/, "").trim())
      .join(", ");

    const email = (formData.email_address || "").toLowerCase().trim();

    const isDuplicate = existingCompanies.some(
      (c) =>
        c.company_name === name &&
        c.contact_person === person &&
        c.contact_number === numbers &&
        c.email_address === email,
    );

    setDuplicate({
      contact: isDuplicate,
    });
  }, [
    formData.company_name,
    formData.email_address,
    contactPersons,
    contactNumbers,
    existingCompanies,
  ]);

  /* COMPANY NAME EXISTENCE CHECK */
  useEffect(() => {
    const name = formData.company_name.toLowerCase().trim();
    const exists = existingCompanies.some(
      (c) => c.company_name === name
    );
    setCompanyExists(exists);
  }, [formData.company_name, existingCompanies]);

  const isFormValid = () => {
    const hasAnyInput =
      formData.company_name.trim() ||
      formData.address.trim() ||
      formData.industry ||
      formData.email_address.trim() ||
      contactPersons.some((p) => p.name.trim()) ||
      contactNumbers.some((n) => n.number.trim());

    const emailValid =
      !formData.email_address ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address);

    if (!hasAnyInput) return false;
    if (!emailValid) return false;

    // ❌ IMPORTANT: block save if exact duplicate (all fields match)
    if (duplicate.contact) return false;

    return true;
  };

  /* ACCOUNT REFERENCE GENERATOR */
  const generateAccountReferenceNumber = async (companyName: string) => {
    // 🔹 fallback prefix if company name is empty
    const prefix = companyName.trim()
      ? companyName.trim().substring(0, 2).toUpperCase()
      : "NA";

    const res = await fetch(`/api/get-account-references?prefix=${prefix}-CSR`);
    const data = await res.json();

    const references: string[] = Array.isArray(data?.references)
      ? data.references
      : [];

    let max = 0;
    references.forEach((r) => {
      const m = r.match(/CSR-(\d{8})$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });

    return `${prefix}-CSR-${String(max + 1).padStart(8, "0")}`;
  };

  /* CONTACT NUMBER HANDLERS */
  const handleContactChange = (index: number, value: string) => {
    const updated = [...contactNumbers];
    updated[index] = { ...updated[index], number: value };
    setContactNumbers(updated);
  };

  const handleCountryCodeChange = (index: number, countryCode: string) => {
    const updated = [...contactNumbers];
    updated[index] = { ...updated[index], countryCode };
    setContactNumbers(updated);
  };

  const addContactField = () => {
    setContactNumbers((prev) => [...prev, { countryCode: "+63", number: "" }]);
  };

  const removeContactField = (index: number) => {
    if (contactNumbers.length === 1) return;
    const updated = [...contactNumbers];
    updated.splice(index, 1);
    setContactNumbers(updated);
  };

  const handleSave = async () => {
    if (saving) return; // 🔒 stop double click
    if (!isFormValid()) {
      toast.error("Please complete required fields and avoid duplicates.");
      return;
    }

    try {
      setSaving(true); // 🔒 lock button

      const account_reference_number = await generateAccountReferenceNumber(
        formData.company_name,
      );

      const joinedContacts = contactNumbers
        .map((n) => `${n.countryCode} ${n.number}`.trim())
        .filter((n) => n.replace(/\+\d+/, "").trim())
        .join(", ");

const joinedEmails = emailAddresses
  .map((e) => e.trim())
  .filter((e) => {
    if (!e) return false;
    const atCount = (e.match(/@/g) || []).length;
    return atCount === 1 && !e.includes(",") && !e.includes("/");
  })
  .join(", ");

      const joinedPersons = contactPersons
        .map((p) => `${p.title} ${p.name}`.trim())
        .filter((p) => p !== "")
        .join(", ");

      const res = await fetch("/api/com-save-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceid,
          account_reference_number,
          ...formData,
contact_person: joinedPersons,
contact_number: joinedContacts,
email_address: joinedEmails,
date_created: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to save");
      }

      toast.success("Company saved");
      setOpen(false);
      resetForm();
      await onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Saving failed");
    } finally {
      setSaving(false); // 🔓 unlock
    }
  };

  const resetForm = () => {
    setFormData({
      tsm: "",
      company_name: "",
      contact_person: "",
      contact_number: "",
      email_address: "",
      address: "",
      industry: "",
      type_client: "New Client",
      manager: null,
      region: null,
      company_group: null,
      status: "Active",
    });
    setContactNumbers([{ countryCode: "+63", number: "" }]);
    setEmailAddresses([""]);
    setDuplicate({ contact: false });
    setCompanyExists(false);
    setContactPersons([{ title: "Mr.", name: "" }]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer">Add Account</Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[420px] sm:w-[480px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Add New Account</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FieldGroup className="space-y-5">
            <Field>
              <FieldLabel>Company *</FieldLabel>
              <Input
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company_name: e.target.value.toUpperCase(),
                  })
                }
                className={duplicate.contact ? "border-red-500" : ""}
              />
              {duplicate.contact && (
                <p className="text-xs text-red-600 mt-1">
                  Exact duplicate record exists (same company, contact person,
                  number and email)
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Customer Name *</FieldLabel>

              <div className="space-y-2">
                {contactPersons.map((person, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    {/* Title Dropdown */}
                    <Select
                      value={person.title}
                      onValueChange={(value) => {
                        const updated = [...contactPersons];
                        updated[idx].title = value;
                        setContactPersons(updated);
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr.">Mr.</SelectItem>
                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                        <SelectItem value="Ms.">Ms.</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Name Input */}
                    <Input
                      value={person.name}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[,/]/g, "");
                        const updated = [...contactPersons];
                        updated[idx].name = cleaned;
                        setContactPersons(updated);
                      }}
                      placeholder="Customer Name"
                      className="flex-grow"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (contactPersons.length === 1) return;
                        const updated = [...contactPersons];
                        updated.splice(idx, 1);
                        setContactPersons(updated);
                      }}
                    >
                      −
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setContactPersons((prev) => [
                      ...prev,
                      { title: "Mr.", name: "" },
                    ])
                  }
                >
                  + Add another name
                </Button>
              </div>
            </Field>

            {/* ✅ MULTIPLE CONTACT NUMBERS with Country Selector */}
            <Field>
              <FieldLabel>Contact Number *</FieldLabel>
              <div className="space-y-2">
                {contactNumbers.map((num, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    {/* Country Code Selector */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[100px] justify-between px-2"
                          type="button"
                        >
                          <span className="mr-1">{countryCodes.find(c => c.code === num.countryCode)?.flag}</span>
                          {num.countryCode}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" onWheel={(e) => e.stopPropagation()}>
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden" onWheel={(e) => e.stopPropagation()}>
                            <CommandEmpty>No country found</CommandEmpty>
                            {countryCodes.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.country} ${country.code}`}
                                onSelect={() => handleCountryCodeChange(idx, country.code)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    num.countryCode === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="mr-2">{country.flag}</span>
                                <span className="flex-1">{country.country}</span>
                                <span className="text-muted-foreground">{country.code}</span>
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Input
                      type="tel"
                      value={num.number}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[,/]/g, "");
                        handleContactChange(idx, cleaned);
                      }}
                      placeholder="9123456789"
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeContactField(idx)}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addContactField}
                >
                  + Add another number
                </Button>
              </div>
            </Field>

<Field>
  <FieldLabel>Email Address</FieldLabel>

  <div className="space-y-2">
    {emailAddresses.map((email, idx) => (
      <div key={idx} className="flex gap-2 items-center">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            let value = e.target.value;
            // Block commas and slashes
            value = value.replace(/[,/]/g, "");
            // Block second @ symbol
            const atCount = (value.match(/@/g) || []).length;
            if (atCount > 1) {
              const firstAtIndex = value.indexOf("@");
              value = value.substring(0, firstAtIndex + 1) + value.substring(firstAtIndex + 1).replace(/@/g, "");
            }
            const updated = [...emailAddresses];
            updated[idx] = value;
            setEmailAddresses(updated);
          }}
          placeholder="email@example.com"
          className="flex-grow"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (emailAddresses.length === 1) return;
            const updated = [...emailAddresses];
            updated.splice(idx, 1);
            setEmailAddresses(updated);
          }}
        >
          −
        </Button>
      </div>
    ))}

    <Button
      type="button"
      variant="secondary"
      onClick={() => setEmailAddresses((prev) => [...prev, ""])}
    >
      + Add another email
    </Button>
  </div>
</Field>

            <Field>
              <FieldLabel>Address *</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Client Segment *</FieldLabel>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {formData.industry || "Select client segment"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search client segment..." />

                    <CommandList
                      className="max-h-[240px] overflow-y-auto overscroll-contain"
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty>No segment found</CommandEmpty>

                      {clientSegments.map((segment) => (
                        <CommandItem
                          key={segment}
                          value={segment}
                          onSelect={() =>
                            setFormData({
                              ...formData,
                              industry: segment,
                            })
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.industry === segment
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {segment}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>
          </FieldGroup>
        </div>

        <div className="px-6 py-4 border-t flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!isFormValid() || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            className="flex-1"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
