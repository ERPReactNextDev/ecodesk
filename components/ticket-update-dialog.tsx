"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { User, User2 } from "lucide-react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { CancelDialog } from "./activity-cancel-dialog";
import { TicketSheet } from "./sheet-ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

const toDatetimeLocal = (value?: string) => {
  if (!value) return "";

  const d = new Date(value);

  if (isNaN(d.getTime())) return "";

  // convert to local time string for datetime-local input
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
};

interface Activity {
  _id: string;
  ticket_reference_number: string;
  client_segment: string;
  traffic: string;
  source_company: string;
  ticket_received: string;
  ticket_endorsed: string;
  gender: string;
  channel: string;
  wrap_up: string;
  source: string;
  customer_type: string;
  customer_status: string;
  status: string;
  department: string;
  manager: string;
  agent: string;
  department_head: string;
  remarks: string;
  inquiry: string;
  item_code: string;
  item_description: string;
  po_number: string;
  so_date: string;
  so_number: string;
  so_amount: string;
  qty_sold: string;
  quotation_number: string;
  quotation_amount: string;
  payment_terms: string;
  po_source: string;
  payment_date: string;
  delivery_date: string;
  date_created?: string;
  date_updated: string;
  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;
  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;
  company_name: string;
  contact_number: string;
  contact_person: string;
  email_address: string;
}

interface UpdateActivityDialogProps {
  onCreated: (newActivity: Activity) => void;
  _id: string;
  ticket_reference_number: string;
  referenceid: string;
  type_client?: string;

  //marked
  contact_number: string;
  email_address: string;
  contact_person: string;
  address: string;
  company_name: string;
  account_reference_number: string;

  ticket_received?: string;
  ticket_endorsed?: string;

  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;

  traffic?: string;
  source_company?: string;
  gender: string;
  channel?: string;
  wrap_up?: string;
  source?: string;
  customer_type?: string;
  customer_status?: string;
  status?: string;
  department?: string;
  department_head?: string;
  manager?: string;
  agent?: string;
  remarks?: string;
  inquiry?: string;
  item_code?: string;
  item_description?: string;
  po_number?: string;
  so_date?: string;
  so_number?: string;
  so_amount?: string;
  qty_sold?: string;
  quotation_number?: string;
  quotation_amount?: string;
  payment_terms?: string;
  po_source?: string;
  payment_date?: string;
  delivery_date?: string;
  date_created?: string;
  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;

  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;
}

function SpinnerEmpty({ onCancel }: { onCancel?: () => void }) {
  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Processing your request</EmptyTitle>
        <EmptyDescription>
          Please wait while we process your request. Do not refresh the page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function generateTicketReferenceNumber() {
  const randomNumber = Math.floor(Math.random() * 10 ** 11); // 11 digits max
  const paddedNumber = randomNumber.toString().padStart(11, "0");
  return `CSR-Ticket-${paddedNumber}`;
}

export function UpdateTicketDialog({
  onCreated,
  _id,
  ticket_reference_number,
  referenceid,
  type_client,
  contact_number,
  company_name,
  contact_person,
  email_address,
  address,
  account_reference_number,
  ticket_received,
  ticket_endorsed,
  inquiry_received,
  response_to_inquiry,
  handling_csr,
  traffic,
  source_company,
  gender,
  channel,
  wrap_up,
  source,
  customer_type,
  customer_status,
  status,
  department,
  manager,
  agent,
  remarks,
  inquiry,
  item_code,
  item_description,
  department_head,
  po_number,
  so_date,
  so_number,
  so_amount,
  qty_sold,
  close_reason,
  counter_offer,
  client_specs,
  tsm_acknowledge_date,
  tsa_acknowledge_date,
  tsm_handling_time,
  tsa_handling_time,
  hr_acknowledge_date,
  quotation_number,
  quotation_amount,
  payment_terms,
  po_source,
  payment_date,
  delivery_date,
  date_created,
}: UpdateActivityDialogProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [step, setStep] = useState(1);

  const [activityRef, setActivityRef] = useState(_id);
  const [ticketReferenceNumber, setTicketReferenceNumber] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactPersons, setContactPersons] = useState<
    { title: string; name: string }[]
  >([{ title: "Mr.", name: "" }]);
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

  const [clientSegment, setClientSegment] = useState("");
  const [trafficState, setTraffic] = useState("");
  const [sourceCompanyState, setSourceCompany] = useState("");
  const [ticketReceivedState, setTicketReceived] = useState("");
  const [ticketEndorsedState, setTicketEndorsed] = useState("");
  const [tsmAcknowledgeDate, setTsmAcknowledgeDate] = useState("");
  const [tsaAcknowledgeDate, setTsaAcknowledgeDate] = useState("");
  const [tsmHandlingTime, setTsmHandlingTime] = useState("");
  const [tsaHandlingTime, setTsaHandlingTime] = useState("");
  const [handlingCSR, setHandlingCSR] = useState("");
  const [inquiryReceived, setInquiryReceived] = useState("");
  const [responseToInquiry, setResponseToInquiry] = useState("");
  const [hrAcknowledgeDate, setHrAcknowledgeDate] = useState("");

  const [genderState, setGender] = useState("");
  const [channelState, setChannel] = useState("");
  const [wrapUpState, setWrapUp] = useState("");
  const isJobApplicant =
    wrapUpState === "Job Applicants" || wrapUpState === "Inquiry";
  const [sourceState, setSource] = useState("");
  const [customerTypeState, setCustomerType] = useState("");
  const [customerStatusState, setCustomerStatus] = useState("");
  const [statusState, setStatus] = useState("");
  const [departmentState, setDepartment] = useState("");
  const [managerState, setManager] = useState("");
  const [agentState, setAgent] = useState("");
  const [departmentHeadState, setDepartmentHeadState] = useState("");
  const [remarksState, setRemarks] = useState("");
  const [inquiryState, setInquiry] = useState("");
  const [itemCodeState, setItemCode] = useState("");
  const [itemDescriptionState, setItemDescription] = useState("");
  const [poNumberState, setPoNumber] = useState("");
  const [soDateState, setSoDate] = useState("");
  const [soNumberState, setSoNumber] = useState("");
  const [soAmountState, setSoAmount] = useState("");
  const [quotationNumberState, setQuotationNumber] = useState("");
  const [quotationAmountState, setQuotationAmount] = useState("");
  const [qtySoldState, setQtySold] = useState("");
  const [paymentTermsState, setPaymentTerms] = useState("");
  const [poSourceState, setPoSource] = useState("");
  const [paymentDateState, setPaymentDate] = useState("");
  const [deliveryDateState, setDeliveryDate] = useState("");
  const [dateCreatedState, setDateCreated] = useState("");

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");

  const [closeReason, setCloseReason] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [clientSpecs, setClientSpecs] = useState("");

  useEffect(() => {
    setActivityRef(_id || "");
    setClientSegment(type_client || "");
    setTraffic(traffic || "");
    setSourceCompany(source_company || "");
    setTicketReceived(ticket_received || "");
    setTicketEndorsed(ticket_endorsed || "");
    setGender(gender || "");
    setChannel(channel || "");
    setWrapUp(wrap_up || "");
    setSource(source || "");
    setCustomerType(customer_type || "");
    setCustomerStatus(customer_status || "");
    setStatus(status || "");
    setDepartment(department || "");
    setManager(manager || "");
    setAgent(agent || "");
    setDepartmentHeadState(department_head || "");
    setRemarks(remarks || "");
    setInquiry(inquiry || "");
    setItemCode(item_code || "");
    setItemDescription(item_description || "");
    setPoNumber(po_number || "");
    setSoDate(so_date || "");
    setSoNumber(so_number || "");
    setSoAmount(so_amount?.toString() || "");
    setQuotationNumber(quotation_number || "");
    setQuotationAmount(quotation_amount || "");
    setQtySold(qty_sold || "");
    setPaymentTerms(payment_terms || "");
    setPoSource(po_source || "");
    setPaymentDate(payment_date || "");
    setDeliveryDate(delivery_date || "");
    setDateCreated(date_created || "");
    setHandlingCSR(handling_csr || "");
    setInquiryReceived(toDatetimeLocal(inquiry_received));
    setResponseToInquiry(toDatetimeLocal(response_to_inquiry));

    setCloseReason(close_reason || "");
    setCounterOffer(counter_offer || "");
    setClientSpecs(client_specs || "");

    setTsmAcknowledgeDate(toDatetimeLocal(tsm_acknowledge_date));
    setTsaAcknowledgeDate(toDatetimeLocal(tsa_acknowledge_date));
    setTsmHandlingTime(toDatetimeLocal(tsm_handling_time));
    setTsaHandlingTime(toDatetimeLocal(tsa_handling_time));
    setHrAcknowledgeDate(toDatetimeLocal(hr_acknowledge_date));

    setCompanyName(company_name || "");
    setContactPersons(
      contact_person
        ? contact_person.split(", ").map((full) => {
            const parts = full.trim().split(" ");
            const possibleTitle = parts[0];
            const titles = ["Mr.", "Mrs.", "Ms."];

            if (titles.includes(possibleTitle)) {
              return {
                title: possibleTitle,
                name: parts.slice(1).join(" "),
              };
            }

            return {
              title: "Mr.",
              name: full,
            };
          })
        : [{ title: "Mr.", name: "" }],
    );
    // Parse contact numbers with country codes
    const parseContactNumbers = (contactStr: string): ContactNumber[] => {
      if (!contactStr) return [{ countryCode: "+63", number: "" }];
      return contactStr.split(", ").map((full) => {
        const match = full.trim().match(/^(\+\d+)\s*(.*)$/);
        if (match) {
          return { countryCode: match[1], number: match[2] };
        }
        return { countryCode: "+63", number: full.trim() };
      });
    };
    setContactNumbers(parseContactNumbers(contact_number));
    setEmailAddresses(email_address ? email_address.split(", ") : [""]);

    setDateCreated(toDatetimeLocal(date_created));
  }, [
    _id,
    type_client,
    traffic,
    source_company,
    ticket_received,
    ticket_endorsed,
    inquiry_received,
    response_to_inquiry,
    handling_csr,
    gender,
    channel,
    wrap_up,
    source,
    customer_type,
    customer_status,
    status,
    department,
    manager,
    agent,
    remarks,
    inquiry,
    item_code,
    item_description,
    po_number,
    so_date,
    so_number,
    so_amount,
    quotation_number,
    quotation_amount,
    qty_sold,
    payment_terms,
    po_source,
    payment_date,
    delivery_date,
    date_created,
    tsm_acknowledge_date,
    tsa_acknowledge_date,
    tsm_handling_time,
    tsa_handling_time,
    company_name,
    contact_number,
    contact_person,
    email_address,
  ]);

  useEffect(() => {
    if (ticket_reference_number) {
      setTicketReferenceNumber(ticket_reference_number);
    } else {
      // Auto generate if empty
      setTicketReferenceNumber(generateTicketReferenceNumber());
    }
  }, [ticket_reference_number]);

  useEffect(() => {
    if (isJobApplicant && step > 3) {
      setStep(3);
    }
  }, [isJobApplicant, step]);

  const handleUpdate = async () => {
    setLoading(true);

    const newActivity: Activity & {
      close_reason?: string;
      counter_offer?: string;
      client_specs?: string;
    } = {
      _id: activityRef,
      ticket_reference_number: ticketReferenceNumber,
      client_segment: clientSegment,
      traffic: trafficState,
      source_company: sourceCompanyState,

      ticket_received: ticketReceivedState,
      ticket_endorsed: ticketEndorsedState,

      inquiry_received: inquiryReceived,
      response_to_inquiry: responseToInquiry,
      handling_csr: handlingCSR,

      company_name: companyName,
      contact_number: contactNumbers
        .map((n) => `${n.countryCode} ${n.number}`.trim())
        .filter((n) => n.replace(/\+\d+/, "").trim())
        .join(", "),
      contact_person: contactPersons
        .map((p) => `${p.title} ${p.name}`.trim())
        .filter((p) => p !== "")
        .join(", "),
      email_address: emailAddresses
        .map((e) => e.trim())
        .filter((e) => {
          if (!e) return false;
          const atCount = (e.match(/@/g) || []).length;
          return atCount === 1 && !e.includes(",") && !e.includes("/");
        })
        .join(", "),

      // ✅ ADD THESE
      tsm_acknowledge_date: tsmAcknowledgeDate,
      tsa_acknowledge_date: tsaAcknowledgeDate,
      tsm_handling_time: tsmHandlingTime,
      tsa_handling_time: tsaHandlingTime,
      hr_acknowledge_date: hrAcknowledgeDate,

      gender: genderState,
      channel: channelState,
      wrap_up: wrapUpState,
      source: sourceState,
      ...(wrapUpState === "Inquiry" && {
        close_reason: "Inquiry Handled",
      }),

      ...(wrapUpState === "Job Applicants" && {
        close_reason: "Job Application Received",
      }),
      customer_type: customerTypeState,
      customer_status: customerStatusState,
      ...(wrapUpState === "Job Applicants" || wrapUpState === "Inquiry"
        ? { status: "Closed" }
        : { status: statusState }),
      department: departmentState,
      manager: managerState,
      agent: agentState,
      department_head: departmentHeadState,
      remarks: remarksState,
      inquiry: inquiryState,
      item_code: itemCodeState,
      item_description: itemDescriptionState,
      po_number: poNumberState,
      so_date: soDateState,
      so_number: soNumberState,
      so_amount: soAmountState,
      quotation_number: quotationNumberState,
      quotation_amount: quotationAmountState,
      qty_sold: qtySoldState,
      payment_terms: paymentTermsState,
      po_source: poSourceState,
      payment_date: paymentDateState,
      delivery_date: deliveryDateState,
      date_created: dateCreatedState,
      date_updated: new Date().toISOString(),

...((statusState === "Closed" ||
  wrapUpState === "Job Applicants" ||
  wrapUpState === "Inquiry") && {
  close_reason:
    wrapUpState === "Inquiry"
      ? "Inquiry Handled"
      : wrapUpState === "Job Applicants"
      ? "Job Application Received"
      : closeReason,
  counter_offer: counterOffer,
  client_specs: clientSpecs,
}),

      // 🔥 IF SAVING AS CONVERTED INTO SALES – KEEP CLOSE FIELDS
      ...(statusState === "Converted into Sales" && {
        close_reason: closeReason,
        counter_offer: counterOffer,
        client_specs: clientSpecs,
      }),
    };

    // 🔥 CLEAR STEPS 4–6 ONLY WHEN SAVING AT STEP 3 (JOB APPLICANTS)
    if (
      (wrapUpState === "Job Applicants" || wrapUpState === "Inquiry") &&
      step === 3
    ) {
      newActivity.customer_type = "-";
      newActivity.customer_status = "-";
      newActivity.department = "-";
      newActivity.manager = "-";
      newActivity.agent = "-";

      newActivity.remarks = "-";
      newActivity.inquiry = "-";

      newActivity.item_code = "-";
      newActivity.item_description = "-";
      newActivity.po_number = "-";
      newActivity.so_date = "-";
      newActivity.so_number = "-";
      newActivity.so_amount = "-";
      newActivity.qty_sold = "-";

      newActivity.quotation_number = "-";
      newActivity.quotation_amount = "-";

      newActivity.payment_terms = "-";
      newActivity.po_source = "-";
      newActivity.payment_date = "-";
      newActivity.delivery_date = "-";

      // 🔥 ADD THIS PART – CLEAR TSA / TSM FIELDS
      newActivity.tsm_acknowledge_date = "";
      newActivity.tsm_handling_time = "";
      newActivity.tsa_acknowledge_date = "";
      newActivity.tsa_handling_time = "";

      // ❗ DO NOT TOUCH STATUS
      newActivity.close_reason = "-";
      newActivity.counter_offer = "-";
      newActivity.client_specs = "-";
    }

    try {
      const res = await fetch("/api/act-save-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to save activity.");
        setLoading(false);
        return;
      }

      if (statusState === "Endorsed") {
        try {
          setLoading(true);

          const endorsedData = {
            agent: referenceid,
            account_reference_number,
            company_name,
            contact_person,
            contact_number,
            email_address,
            address,
            ticket_reference_number: ticketReferenceNumber,
            wrap_up: wrapUpState,
            ...(wrapUpState === "Job Applicants" || wrapUpState === "Inquiry"
              ? { status: "Closed" }
              : { status: statusState }),
            inquiry: inquiryState,
            tsm: managerState,
            referenceid: agentState,
            status: "Endorsed",
          };

          const endorsedRes = await fetch("/api/act-save-endorsed-ticket", {
            method: "POST", // <-- now POST
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(endorsedData),
          });

          if (!endorsedRes.ok) {
            const err = await endorsedRes.json();
            toast.error(err.error || "Failed to save endorsed ticket.");
            setLoading(false);
            return;
          }

          toast.success("Ticket successfully endorsed!");
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Something went wrong.");
        } finally {
          setLoading(false);
        }
      }

      // 🔥 ALSO UPDATE COMPANY TABLE (SYNC STEP 1 FIELDS)
      await fetch("/api/com-update-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_head: departmentHeadState,
          account_reference_number,
          company_name: companyName,
          contact_person: contactPersons
            .map((p) => `${p.title} ${p.name}`.trim())
            .filter((p) => p !== "")
            .join(", "),
          contact_number: contactNumbers
            .map((n) => `${n.countryCode} ${n.number}`.trim())
            .filter((n) => n.replace(/\+\d+/, "").trim())
            .join(", "),
          email_address: emailAddresses
            .map((e) => e.trim())
            .filter(Boolean)
            .join(", "),
          address,
        }),
      });

      toast.success("Activity and Company updated successfully!");
      onCreated(newActivity);
      setStep(1);
      setSheetOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setShowConfirmCancel(true);
    } else {
      setSheetOpen(true);
    }
  };

  const confirmCancel = () => {
    setShowConfirmCancel(false);
    setSheetOpen(false);
  };

  const cancelCancel = () => {
    setShowConfirmCancel(false);
    setSheetOpen(true);
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheetOpen(true)}
            className="w-full cursor-pointer text-xs"
          >
            Update
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          style={{ width: "60vh", maxWidth: "none" }}
          className="overflow-auto custom-scrollbar"
        >
          <SheetHeader>
            <SheetTitle>Update Activity</SheetTitle>
            <SheetDescription>
              Fill out the steps to updated activity.
            </SheetDescription>
          </SheetHeader>

          {/* Progress Steps */}
          <div className="flex items-center mb-6">
            {(isJobApplicant ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]).map(
              (s, i, arr) => {
                const isActive = step === s;
                const isCompleted = step > s;

                return (
                  <React.Fragment key={s}>
                    <div
                      className="flex flex-col items-center relative flex-1 cursor-pointer"
                      onClick={() => {
                        if (isJobApplicant && s > 3) return;
                        setStep(s);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setStep(s);
                        }
                      }}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${s}: ${
                        s === 1
                          ? "Traffic"
                          : s === 2
                            ? "Department"
                            : s === 3
                              ? "Ticket"
                              : s === 4
                                ? "Customer"
                                : s === 5
                                  ? "Status"
                                  : "Assignee"
                      }`}
                    >
                      <div
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold z-10
              ${isActive ? "bg-blue-600" : isCompleted ? "bg-green-500" : "bg-gray-300"}
              hover:brightness-90 transition
            `}
                      >
                        {s}
                      </div>
                      <span className="mt-2 text-xs text-center max-w-[70px]">
                        {s === 1 && "Traffic"}
                        {s === 2 && "Department"}
                        {s === 3 && "Ticket"}
                        {s === 4 && "Customer"}
                        {s === 5 && "Status"}
                        {s === 6 && "Assignee"}
                      </span>

                      {i !== arr.length - 1 && (
                        <div
                          className={`absolute top-5 right-[-50%] w-full h-1 ${
                            step > s ? "bg-green-500" : "bg-gray-300"
                          }`}
                          style={{ zIndex: 0 }}
                        />
                      )}
                    </div>
                  </React.Fragment>
                );
              },
            )}
          </div>

          {loading ? (
            <SpinnerEmpty onCancel={() => setSheetOpen(false)} />
          ) : (
            <div className="p-4 grid gap-6">
              {/* Step 1: Traffic */}
              {step === 1 && (
                <div>
                  <FieldGroup>
                    <FieldSet>
                      <FieldLabel className="font-semibold text-sm">
                        Company Name
                      </FieldLabel>
                      <Input
                        type="text"
                        value={companyName}
                        onChange={(e) =>
                          setCompanyName(e.target.value.toUpperCase())
                        }
                        className="w-full"
                      />
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldGroup>
                        <FieldSet className="mt-4">
                          <FieldLabel className="font-semibold text-sm">
                            Contact Person
                          </FieldLabel>

                          <div className="space-y-2">
                            {contactPersons.map((person, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
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
                                  className="flex-1"
                                />

                                {/* Remove Button */}
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

                            {/* Add Button */}
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
                              + Add another person
                            </Button>
                          </div>
                        </FieldSet>
                      </FieldGroup>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel className="font-semibold text-sm">
                        Contact Number
                      </FieldLabel>

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
                                        onSelect={() => {
                                          const updated = [...contactNumbers];
                                          updated[idx] = { ...updated[idx], countryCode: country.code };
                                          setContactNumbers(updated);
                                        }}
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
                              value={num.number}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/[,/]/g, "");
                                const updated = [...contactNumbers];
                                updated[idx] = { ...updated[idx], number: cleaned };
                                setContactNumbers(updated);
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (contactNumbers.length === 1) return;
                                const updated = [...contactNumbers];
                                updated.splice(idx, 1);
                                setContactNumbers(updated);
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
                            setContactNumbers((prev) => [...prev, { countryCode: "+63", number: "" }])
                          }
                        >
                          + Add another number
                        </Button>
                      </div>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel className="font-semibold text-sm">
                        Email Address
                      </FieldLabel>

                      <div className="space-y-2">
                        {emailAddresses.map((email, idx) => (
                          <div key={idx} className="flex gap-2">
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
                              className="flex-1"
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
                          onClick={() =>
                            setEmailAddresses((prev) => [...prev, ""])
                          }
                        >
                          + Add another email
                        </Button>
                      </div>
                    </FieldSet>
                  </FieldGroup>

                  {/* MOVED GENDER FROM STEP 3 TO STEP 1 */}
                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel className="font-semibold text-sm">
                        Gender{" "}
                        <span className="text-red-600 text-xs italic">
                          *required
                        </span>
                      </FieldLabel>

                      <RadioGroup
                        value={genderState}
                        onValueChange={setGender}
                        className="flex flex-row gap-6"
                      >
                        <FieldLabel className="cursor-pointer">
                          <Field
                            orientation="horizontal"
                            className="items-center"
                          >
                            <FieldContent className="flex items-center gap-2">
                              <User className="text-blue-600" size={18} />
                              <span>Male</span>
                            </FieldContent>

                            <RadioGroupItem value="Male" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field
                            orientation="horizontal"
                            className="items-center"
                          >
                            <FieldContent className="flex items-center gap-2">
                              <User2 className="text-pink-600" size={18} />
                              <span>Female</span>
                            </FieldContent>

                            <RadioGroupItem value="Female" />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel>
                        Choose Traffic{" "}
                        <span className="text-red-600 text-xs italic">
                          *required
                        </span>
                      </FieldLabel>
                      <RadioGroup
                        defaultValue={trafficState}
                        onValueChange={(value) => {
                          setTraffic(value);
                          setStartDate(new Date().toISOString());
                        }}
                      >
                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Sales</FieldTitle>
                              <FieldDescription>
                                Make outgoing calls or sales interactions.
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Sales" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Non-Sales</FieldTitle>
                              <FieldDescription>
                                Handle general inquiries or assistance.
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Non-Sales" />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet>
                      <FieldLabel className="mt-4">
                        Choose Company{" "}
                        <span className="text-red-600 text-xs italic">
                          *required
                        </span>
                      </FieldLabel>
                      <RadioGroup
                        defaultValue={sourceCompanyState}
                        onValueChange={(value) => {
                          setSourceCompany(value);
                          setStartDate(new Date().toISOString());
                        }}
                      >
                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Ecoshift Corporation</FieldTitle>
                              <FieldDescription>
                                The Fastest-Growing Provider of Innovative
                                Lighting Solutions
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Ecoshift Corporation" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Disruptive Solutions Inc</FieldTitle>
                              <FieldDescription>
                                Future-ready lighting solutions that brighten
                                spaces, cut costs, and power smarter business
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Disruptive Solutions Inc" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Buildchem Solutions</FieldTitle>
                              <FieldDescription>
                                Manufactures high-performance chemical products
                                for the building and infrastructure sectors.
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Buildchem Solutions" />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>

                  <Button
                    className="mt-4 w-full cursor-pointer"
                    onClick={() => setStep(2)}
                    disabled={
                      !trafficState || !sourceCompanyState || !genderState
                    }
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Steps 2 - 6: TicketSheet */}
              {(trafficState === "Sales" || trafficState === "Non-Sales") && (
                <TicketSheet
                  step={step}
                  setStep={setStep}
                  ticketReceived={ticketReceivedState}
                  setTicketReceived={setTicketReceived}
                  ticketEndorsed={ticketEndorsedState}
                  setTicketEndorsed={setTicketEndorsed}
                  gender={genderState}
                  setGender={setGender}
                  channel={channelState}
                  setChannel={setChannel}
                  wrapUp={wrapUpState}
                  setWrapUp={setWrapUp}
                  source={sourceState}
                  setSource={setSource}
                  customerType={customerTypeState}
                  setCustomerType={setCustomerType}
                  customerStatus={customerStatusState}
                  setCustomerStatus={setCustomerStatus}
                  status={statusState}
                  setStatus={setStatus}
                  department={departmentState}
                  setDepartment={setDepartment}
                  manager={managerState}
                  setManager={setManager}
                  agent={agentState}
                  setAgent={setAgent}
                  remarks={remarksState}
                  setRemarks={setRemarks}
                  inquiry={inquiryState}
                  setInquiry={setInquiry}
                  itemCode={itemCodeState}
                  setItemCode={setItemCode}
                  itemDescription={itemDescriptionState}
                  setItemDescription={setItemDescription}
                  poNumber={poNumberState}
                  setPoNumber={setPoNumber}
                  soDate={soDateState}
                  setSoDate={setSoDate}
                  soNumber={soNumberState}
                  setSoNumber={setSoNumber}
                  soAmount={soAmountState}
                  setSoAmount={setSoAmount}
                  quotationNumber={quotationNumberState}
                  setQuotationNumber={setQuotationNumber}
                  quotationAmount={quotationAmountState}
                  setQuotationAmount={setQuotationAmount}
                  qtySold={qtySoldState}
                  setQtySold={setQtySold}
                  paymentTerms={paymentTermsState}
                  setPaymentTerms={setPaymentTerms}
                  poSource={poSourceState}
                  setPoSource={setPoSource}
                  paymentDate={paymentDateState}
                  setPaymentDate={setPaymentDate}
                  deliveryDate={deliveryDateState}
                  setDeliveryDate={setDeliveryDate}
                  dateCreated={dateCreatedState}
                  setDateCreated={setDateCreated}
                  handlingCSR={handlingCSR}
                  setHandlingCSR={setHandlingCSR}
                  inquiryReceived={inquiryReceived}
                  setInquiryReceived={setInquiryReceived}
                  responseToInquiry={responseToInquiry}
                  setResponseToInquiry={setResponseToInquiry}
                  loading={loading}
                  ticketReferenceNumber={ticketReferenceNumber}
                  setTicketReferenceNumber={setTicketReferenceNumber}
                  handleBack={() => setStep((prev) => prev - 1)}
                  handleNext={() => {
                    if (isJobApplicant && step === 3) return;
                    setStep((prev) => prev + 1);
                  }}
                  handleUpdate={handleUpdate}
                  closeReason={closeReason}
                  setCloseReason={setCloseReason}
                  counterOffer={counterOffer}
                  setCounterOffer={setCounterOffer}
                  clientSpecs={clientSpecs}
                  setClientSpecs={setClientSpecs}
                  tsmAcknowledgeDate={tsmAcknowledgeDate}
                  setTsmAcknowledgeDate={setTsmAcknowledgeDate}
                  tsaAcknowledgeDate={tsaAcknowledgeDate}
                  setTsaAcknowledgeDate={setTsaAcknowledgeDate}
                  tsmHandlingTime={tsmHandlingTime}
                  setTsmHandlingTime={setTsmHandlingTime}
                  tsaHandlingTime={tsaHandlingTime}
                  setTsaHandlingTime={setTsaHandlingTime}
                  hrAcknowledgeDate={hrAcknowledgeDate}
                  setHrAcknowledgeDate={setHrAcknowledgeDate}
                  department_head={departmentHeadState}
                  setDepartmentHead={setDepartmentHeadState}
                  referenceid={referenceid}
                />
              )}
            </div>
          )}

          {showConfirmCancel && (
            <CancelDialog onCancel={cancelCancel} onConfirm={confirmCancel} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
