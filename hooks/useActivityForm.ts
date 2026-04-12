"use client";

import { useReducer, useCallback, useMemo } from "react";

interface ContactPerson {
  title: string;
  name: string;
}

interface ActivityFormState {
  // UI State
  sheetOpen: boolean;
  showConfirmCancel: boolean;
  step: number;
  loading: boolean;

  // Ticket Info
  activityRef: string;
  ticketReferenceNumber: string;

  // Company Info
  companyName: string;
  contactPersons: ContactPerson[];
  contactNumbers: string[];
  emailAddresses: string[];

  // Traffic & Department
  clientSegment: string;
  traffic: string;
  sourceCompany: string;
  ticketReceived: string;
  ticketEndorsed: string;
  tsmAcknowledgeDate: string;
  tsaAcknowledgeDate: string;
  tsmHandlingTime: string;
  tsaHandlingTime: string;
  handlingCSR: string;
  inquiryReceived: string;
  responseToInquiry: string;
  hrAcknowledgeDate: string;

  // Customer Info
  gender: string;
  channel: string;
  wrapUp: string;
  source: string;
  customerType: string;
  customerStatus: string;

  // Status & Assignment
  status: string;
  department: string;
  manager: string;
  agent: string;
  departmentHead: string;
  remarks: string;

  // Sales Info
  inquiry: string;
  itemCode: string;
  itemDescription: string;
  poNumber: string;
  soDate: string;
  soNumber: string;
  soAmount: string;
  quotationNumber: string;
  quotationAmount: string;
  qtySold: string;
  paymentTerms: string;
  poSource: string;
  paymentDate: string;
  deliveryDate: string;
  dateCreated: string;

  // Close Info
  closeReason: string;
  counterOffer: string;
  clientSpecs: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof ActivityFormState; value: unknown }
  | { type: "SET_FIELDS"; fields: Partial<ActivityFormState> }
  | { type: "RESET_FORM"; initialData?: Partial<ActivityFormState> }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_STEP"; step: number }
  | { type: "OPEN_SHEET" }
  | { type: "CLOSE_SHEET" }
  | { type: "SHOW_CANCEL_CONFIRM" }
  | { type: "HIDE_CANCEL_CONFIRM" }
  | { type: "START_LOADING" }
  | { type: "STOP_LOADING" }
  | { type: "ADD_CONTACT_PERSON" }
  | { type: "REMOVE_CONTACT_PERSON"; index: number }
  | { type: "UPDATE_CONTACT_PERSON"; index: number; field: "title" | "name"; value: string }
  | { type: "ADD_CONTACT_NUMBER" }
  | { type: "REMOVE_CONTACT_NUMBER"; index: number }
  | { type: "UPDATE_CONTACT_NUMBER"; index: number; value: string }
  | { type: "ADD_EMAIL_ADDRESS" }
  | { type: "REMOVE_EMAIL_ADDRESS"; index: number }
  | { type: "UPDATE_EMAIL_ADDRESS"; index: number; value: string };

const initialState: ActivityFormState = {
  sheetOpen: false,
  showConfirmCancel: false,
  step: 1,
  loading: false,
  activityRef: "",
  ticketReferenceNumber: "",
  companyName: "",
  contactPersons: [{ title: "Mr.", name: "" }],
  contactNumbers: [""],
  emailAddresses: [""],
  clientSegment: "",
  traffic: "",
  sourceCompany: "",
  ticketReceived: "",
  ticketEndorsed: "",
  tsmAcknowledgeDate: "",
  tsaAcknowledgeDate: "",
  tsmHandlingTime: "",
  tsaHandlingTime: "",
  handlingCSR: "",
  inquiryReceived: "",
  responseToInquiry: "",
  hrAcknowledgeDate: "",
  gender: "",
  channel: "",
  wrapUp: "",
  source: "",
  customerType: "",
  customerStatus: "",
  status: "",
  department: "",
  manager: "",
  agent: "",
  departmentHead: "",
  remarks: "",
  inquiry: "",
  itemCode: "",
  itemDescription: "",
  poNumber: "",
  soDate: "",
  soNumber: "",
  soAmount: "",
  quotationNumber: "",
  quotationAmount: "",
  qtySold: "",
  paymentTerms: "",
  poSource: "",
  paymentDate: "",
  deliveryDate: "",
  dateCreated: "",
  closeReason: "",
  counterOffer: "",
  clientSpecs: "",
};

function formReducer(state: ActivityFormState, action: FormAction): ActivityFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_FIELDS":
      return { ...state, ...action.fields };

    case "RESET_FORM":
      return { ...initialState, ...action.initialData };

    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, 6) };

    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) };

    case "SET_STEP":
      return { ...state, step: action.step };

    case "OPEN_SHEET":
      return { ...state, sheetOpen: true };

    case "CLOSE_SHEET":
      return { ...state, sheetOpen: false, step: 1 };

    case "SHOW_CANCEL_CONFIRM":
      return { ...state, showConfirmCancel: true };

    case "HIDE_CANCEL_CONFIRM":
      return { ...state, showConfirmCancel: false };

    case "START_LOADING":
      return { ...state, loading: true };

    case "STOP_LOADING":
      return { ...state, loading: false };

    case "ADD_CONTACT_PERSON":
      return {
        ...state,
        contactPersons: [...state.contactPersons, { title: "Mr.", name: "" }],
      };

    case "REMOVE_CONTACT_PERSON":
      if (state.contactPersons.length === 1) return state;
      return {
        ...state,
        contactPersons: state.contactPersons.filter((_, i) => i !== action.index),
      };

    case "UPDATE_CONTACT_PERSON": {
      const updated = [...state.contactPersons];
      updated[action.index] = { ...updated[action.index], [action.field]: action.value };
      return { ...state, contactPersons: updated };
    }

    case "ADD_CONTACT_NUMBER":
      return { ...state, contactNumbers: [...state.contactNumbers, ""] };

    case "REMOVE_CONTACT_NUMBER":
      if (state.contactNumbers.length === 1) return state;
      return {
        ...state,
        contactNumbers: state.contactNumbers.filter((_, i) => i !== action.index),
      };

    case "UPDATE_CONTACT_NUMBER": {
      const updated = [...state.contactNumbers];
      updated[action.index] = action.value;
      return { ...state, contactNumbers: updated };
    }

    case "ADD_EMAIL_ADDRESS":
      return { ...state, emailAddresses: [...state.emailAddresses, ""] };

    case "REMOVE_EMAIL_ADDRESS":
      if (state.emailAddresses.length === 1) return state;
      return {
        ...state,
        emailAddresses: state.emailAddresses.filter((_, i) => i !== action.index),
      };

    case "UPDATE_EMAIL_ADDRESS": {
      const updated = [...state.emailAddresses];
      updated[action.index] = action.value;
      return { ...state, emailAddresses: updated };
    }

    default:
      return state;
  }
}

const toDatetimeLocal = (value?: string): string => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export function useActivityForm(initialData?: Partial<ActivityFormState>) {
  const [state, dispatch] = useReducer(formReducer, { ...initialState, ...initialData });

  const setField = useCallback(<K extends keyof ActivityFormState>(
    field: K,
    value: ActivityFormState[K]
  ) => {
    dispatch({ type: "SET_FIELD", field, value });
  }, []);

  const setFields = useCallback((fields: Partial<ActivityFormState>) => {
    dispatch({ type: "SET_FIELDS", fields });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM", initialData });
  }, [initialData]);

  const nextStep = useCallback(() => dispatch({ type: "NEXT_STEP" }), []);
  const prevStep = useCallback(() => dispatch({ type: "PREV_STEP" }), []);
  const setStep = useCallback((step: number) => dispatch({ type: "SET_STEP", step }), []);

  const openSheet = useCallback(() => dispatch({ type: "OPEN_SHEET" }), []);
  const closeSheet = useCallback(() => dispatch({ type: "CLOSE_SHEET" }), []);
  const showCancelConfirm = useCallback(() => dispatch({ type: "SHOW_CANCEL_CONFIRM" }), []);
  const hideCancelConfirm = useCallback(() => dispatch({ type: "HIDE_CANCEL_CONFIRM" }), []);
  const startLoading = useCallback(() => dispatch({ type: "START_LOADING" }), []);
  const stopLoading = useCallback(() => dispatch({ type: "STOP_LOADING" }), []);

  const contactPersonActions = useMemo(
    () => ({
      add: () => dispatch({ type: "ADD_CONTACT_PERSON" }),
      remove: (index: number) => dispatch({ type: "REMOVE_CONTACT_PERSON", index }),
      update: (index: number, field: "title" | "name", value: string) =>
        dispatch({ type: "UPDATE_CONTACT_PERSON", index, field, value }),
    }),
    []
  );

  const contactNumberActions = useMemo(
    () => ({
      add: () => dispatch({ type: "ADD_CONTACT_NUMBER" }),
      remove: (index: number) => dispatch({ type: "REMOVE_CONTACT_NUMBER", index }),
      update: (index: number, value: string) =>
        dispatch({ type: "UPDATE_CONTACT_NUMBER", index, value }),
    }),
    []
  );

  const emailAddressActions = useMemo(
    () => ({
      add: () => dispatch({ type: "ADD_EMAIL_ADDRESS" }),
      remove: (index: number) => dispatch({ type: "REMOVE_EMAIL_ADDRESS", index }),
      update: (index: number, value: string) =>
        dispatch({ type: "UPDATE_EMAIL_ADDRESS", index, value }),
    }),
    []
  );

  const isJobApplicant = useMemo(
    () => state.wrapUp === "Job Applicants" || state.wrapUp === "Inquiry",
    [state.wrapUp]
  );

  const visibleSteps = useMemo(
    () => (isJobApplicant ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]),
    [isJobApplicant]
  );

  return {
    state,
    dispatch,
    setField,
    setFields,
    resetForm,
    nextStep,
    prevStep,
    setStep,
    openSheet,
    closeSheet,
    showCancelConfirm,
    hideCancelConfirm,
    startLoading,
    stopLoading,
    contactPersonActions,
    contactNumberActions,
    emailAddressActions,
    isJobApplicant,
    visibleSteps,
  };
}

export type { ActivityFormState };
