import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "client" | "freelancer" | "terms";
  onAccept?: () => void;
  showAcceptButton?: boolean;
  /** When provided for type="terms", user must accept each section in order; when all accepted, this is called and the outside checkbox can be checked */
  onAllSectionsAccepted?: () => void;
}

interface Section {
  id: string;
  number: string;
  title: string;
  content: string[];
}

/** Full Terms: First section = DigiLocker & Other Verification */
const getTermsSections = (): Section[] => [
  {
    id: "digilocker-verification",
    number: "1",
    title: "DigiLocker & Other Verification",
    content: [
      "1. Identity Verification Requirement\nTHEUNOiA may require students to complete identity verification through DigiLocker to prevent fraudulent or duplicate accounts.",
      "2. User Consent and Redirection\nBy proceeding, the user consents to redirection to DigiLocker and authorizes permitted verification data sharing.",
      "3. Duplicate Account Policy\nOnly one verified account per individual is permitted. Duplicate accounts linked to the same verified identity may be suspended or removed.",
      "4. Data Handling\nTHEUNOiA does not store Aadhaar numbers or Aadhaar documents. Only verification status and a non-reversible technical identifier may be retained.",
      "5. Limitation of Liability\nTHEUNOiA is not responsible for errors, delays, or outages related to DigiLocker services.",
      "6. Modifications\nTHEUNOiA reserves the right to modify verification requirements to comply with applicable laws and platform requirements."
    ]
  },
  {
    id: "introduction",
    number: "2",
    title: "Introduction & Legal Scope",
    content: [
      "These Terms & Conditions (\"Terms\") constitute a legally binding agreement between the user (\"User\") and M/S THEUNOiA LLP, a limited liability partnership duly incorporated and existing under the laws of India (\"THEUNOiA\"). These Terms govern the User's access to, registration on, and use of the THEUNOiA digital marketplace, including its website, mobile applications, dashboards, communication tools, and all related services (collectively, the \"Platform\").",
      "By accessing, browsing, registering, or otherwise using the Platform in any manner, the User expressly acknowledges that they have read, understood, and agreed to be bound by these Terms, along with THEUNOiA's Privacy Policy and all applicable statutory laws, rules, regulations, and governmental notifications in force in India, including but not limited to:",
      "• Information Technology Act, 2000\n• Consumer Protection Act, 2019\n• Copyright Act, 1957\n• Arbitration and Conciliation Act, 1996",
      "If you do not agree, you must discontinue use of the Platform.",
      "These Terms apply to all Users of the Platform, whether acting as Buyers, Business Owners, Sellers, or Student Freelancers, and govern all interactions, transactions, and contractual relationships facilitated through the Platform."
    ]
  },
  {
    id: "definitions",
    number: "3",
    title: "Definitions",
    content: [
      "For the purposes of these Terms & Conditions, unless the context otherwise requires:",
      "• Platform – THEUNOiA web and mobile application\n• User – Any registered individual or entity\n• Buyer / Business Owner – User purchasing services\n• Seller / Student Freelancer – User providing services\n• Contract – Fixed-price service agreement accepted on the Platform",
      "Interpretation:\n• Words importing the singular shall include the plural and vice versa.\n• Headings are for convenience only and shall not affect interpretation.\n• References to statutes shall include amendments and re-enactments thereof."
    ]
  },
  {
    id: "platform-role",
    number: "4",
    title: "Platform Role",
    content: [
      "THEUNOiA operates solely as an online technology platform and marketplace intermediary that facilitates interactions between Buyers and Sellers/Student Freelancers for the purpose of discovering, communicating, and entering into independent service contracts.",
      "THEUNOiA does not act as an employer, employee, principal, agent, partner, joint venture, guarantor, or legal representative of any User. No employment relationship, agency relationship, partnership, or fiduciary relationship is created between THEUNOiA and any Buyer or Seller/Student Freelancer.",
      "All contracts for services are entered into directly and exclusively between Buyers and Sellers/Student Freelancers. THEUNOiA is not a party to such contracts and shall not be responsible or liable for the execution, performance, quality, legality, safety, suitability, or completion of any services."
    ]
  },
  {
    id: "eligibility",
    number: "5",
    title: "Eligibility & Account",
    content: [
      "Access to and use of the Platform is permitted only to individuals and entities who are legally competent to enter into a binding contract under the Indian Contract Act, 1872. By registering on or using the Platform, the User represents and warrants that they are at least eighteen (18) years of age.",
      "Users agree to provide true, accurate, complete, and up-to-date information during registration and at all times while using the Platform. THEUNOiA reserves the right to verify User information and to suspend or terminate accounts where information is found to be false, misleading, incomplete, or outdated.",
      "Each User is solely responsible for maintaining the confidentiality of their login credentials, passwords, and account access details, and for all activities conducted through their account."
    ]
  },
  {
    id: "contract-model",
    number: "6",
    title: "Contract Model",
    content: [
      "THEUNOiA facilitates only fixed-price service contracts between Buyers and Sellers/Student Freelancers. Under this model, the total contract consideration, scope of work, deliverables, milestones (if any), and timelines must be clearly defined and mutually agreed upon prior to contract acceptance.",
      "A contract shall be deemed to be legally valid, binding, and enforceable when the Buyer formally accepts the Seller's or Student Freelancer's proposal on the Platform and completes payment of the full contract value through the Platform's authorized payment gateway.",
      "Once a contract is formed, both parties are legally obligated to perform their respective duties in accordance with the agreed terms."
    ]
  },
  {
    id: "payment",
    number: "7",
    title: "Payment & Fees",
    content: [
      "Upon acceptance of a Seller's or Student Freelancer's proposal, the Buyer is required to pay one hundred percent (100%) of the agreed fixed contract value in advance, along with a Buyer Commission Fee of three percent (3%) charged by THEUNOiA for platform facilitation services.",
      "Upon successful completion of the contracted services and confirmation by the Buyer, the Seller or Student Freelancer shall receive the contract consideration after deduction of a Freelancer Commission Fee of five percent (5%).",
      "Payouts are generally released within two (2) to five (5) working days, subject to banking processes, payment gateway settlements, holidays, or dispute resolution."
    ]
  },
  {
    id: "payment-gateway",
    number: "8",
    title: "Payment Gateway",
    content: [
      "All payments on the Platform shall be processed exclusively through THEUNOiA's authorized third-party payment gateway, currently Razorpay, using supported payment methods including UPI, debit cards, credit cards, wallets, and net banking.",
      "THEUNOiA does not store, process, or retain sensitive financial or payment instrument data of Users and relies entirely on the payment gateway's secure infrastructure and compliance standards.",
      "Off-platform payments are strictly prohibited and may result in immediate account suspension, forfeiture of amounts, and legal action."
    ]
  },
  {
    id: "non-circumvention",
    number: "9",
    title: "Non-Circumvention",
    content: [
      "Users agree not to circumvent, bypass, or attempt to bypass the Platform by engaging in off-platform transactions with any Buyer or Seller first introduced through THEUNOiA, including exchanging contact details, entering into external agreements, or avoiding Platform fees.",
      "This restriction shall apply during the course of the engagement and for a period of twelve (12) months thereafter.",
      "Violations may result in: Account termination, Forfeiture of pending payouts, Recovery of fees, and Legal action."
    ]
  },
  {
    id: "refund",
    number: "10",
    title: "Refund & Disputes",
    content: [
      "A Buyer may request a refund only in cases where the contracted work is materially incomplete, does not conform to the agreed scope of work, is delivered after the agreed timeline without approved extension, or is materially deficient in quality.",
      "THEUNOiA may, at its discretion, constitute a neutral Dispute Resolution Committee (DRC) to review disputes between Users. Decisions of the DRC shall be final and binding on all parties.",
      "Disputes must be raised within 15 days of final delivery or contract end."
    ]
  },
  {
    id: "taxes",
    number: "11",
    title: "Taxes & GST",
    content: [
      "All transactions conducted on the Platform shall be denominated in Indian Rupees (INR). Goods and Services Tax (GST) or any other applicable indirect taxes shall be levied on THEUNOiA's commission fees in accordance with prevailing tax laws.",
      "Buyers and Sellers are solely responsible for determining, deducting, depositing, and reporting any applicable direct or indirect taxes, including Tax Deducted at Source (TDS), as may be required under Indian law."
    ]
  },
  {
    id: "ip",
    number: "12",
    title: "Intellectual Property",
    content: [
      "Users retain ownership of all content, materials, and intellectual property they create or upload to the Platform. By using the Platform, Users grant THEUNOiA a non-exclusive, worldwide, royalty-free license to host, display, reproduce, and promote such content solely for the purposes of operating, marketing, and improving the Platform.",
      "Any act of plagiarism, copyright infringement, or unauthorized use of third-party intellectual property may result in immediate account termination and legal action under applicable law."
    ]
  },
  {
    id: "community",
    number: "13",
    title: "Community Guidelines",
    content: [
      "Users agree to communicate and conduct themselves in a respectful, lawful, and professional manner while using the Platform.",
      "Harassment, hate speech, abusive behaviour, misleading conduct, or any violation of applicable Indian laws or IT regulations is strictly prohibited.",
      "THEUNOiA reserves the right to issue warnings, suspend accounts, or permanently terminate access for violations of these guidelines."
    ]
  },
  {
    id: "availability",
    number: "14",
    title: "Service Availability",
    content: [
      "THEUNOiA strives to ensure continuous availability of the Platform but does not guarantee uninterrupted or error-free operation.",
      "Access to the Platform may be temporarily suspended due to maintenance, technical issues, system upgrades, or events beyond reasonable control, including force majeure circumstances."
    ]
  },
  {
    id: "liability",
    number: "15",
    title: "Limitation of Liability",
    content: [
      "To the maximum extent permitted under applicable law, THEUNOiA shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with the use of the Platform or services contracted between Users.",
      "THEUNOiA's total aggregate liability, if any, shall in no event exceed the total Platform fees paid by the concerned User to THEUNOiA in the six (6) months immediately preceding the event giving rise to the claim."
    ]
  },
  {
    id: "indemnification",
    number: "16",
    title: "Indemnification",
    content: [
      "Users agree to indemnify, defend, and hold harmless THEUNOiA, its partners, officers, employees, and affiliates from and against any claims, damages, losses, liabilities, costs, or expenses arising out of or related to breach of these Terms, violation of applicable laws, disputes between Users, misuse of the Platform, or infringement of intellectual property or third-party rights."
    ]
  },
  {
    id: "arbitration",
    number: "17",
    title: "Arbitration & Law",
    content: [
      "In the event of any dispute, the parties agree to first attempt amicable resolution through mediation, failing which the dispute shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996.",
      "The seat and venue of arbitration shall be Maharashtra, India, the proceedings shall be conducted in English, and these Terms shall be governed by and construed in accordance with the laws of India."
    ]
  },
  {
    id: "amendments",
    number: "18",
    title: "Amendments",
    content: [
      "THEUNOiA reserves the right to modify, amend, or update these Terms & Conditions at any time to reflect changes in law, business practices, or Platform functionality.",
      "Updated Terms shall be effective upon being posted on the Platform, and continued access to or use of the Platform after such updates shall constitute deemed acceptance of the revised Terms."
    ]
  },
  {
    id: "contact",
    number: "19",
    title: "Contact Details",
    content: [
      "For any queries, grievances, or legal notices relating to these Terms or the use of the Platform, Users may contact:",
      "M/S THEUNOiA LLP\nC/O Nilkanth, Laxmi Nagar\nChandrapur, Maharashtra – 442403, India\n\n📧 support@theunoia.com"
    ]
  }
];

const getClientSections = (): Section[] => [
  {
    id: "parties",
    number: "1",
    title: "Parties",
    content: [
      "This Agreement is entered into between:",
      "THEUNOiA LLP, a Limited Liability Partnership registered under the Limited Liability Partnership Act, 2008, having its registered office at C/O NILKANTH, LAXMI NAGAR, CHANDRAPUR, MAHARASHTRA - 442401",
      "AND",
      "Client (You)"
    ]
  },
  {
    id: "scope",
    number: "2",
    title: "Scope of Services",
    content: [
      "• THEUNOiA LLP shall connect the Client with suitable student freelancers for assignments, projects, or professional services.",
      "• THEUNOiA LLP acts as a facilitator and service provider, not as the executor of the work."
    ]
  },
  {
    id: "project",
    number: "3",
    title: "Project Details",
    content: [
      "• The project shall be awarded through a bidding process.",
      "• It is expressly agreed that THEUNOiA LLP shall charge the Client a service commission of three percent (3%) on the base project value finalized between the Client and THEUNOiA LLP.",
      "• In addition to the above commission, Goods and Services Tax (GST) at the applicable rate, currently eighteen percent (18%), shall be levied on the base project amount.",
      "• The Client acknowledges that the commission and GST charged are lawful, mandatory, and non-negotiable."
    ]
  },
  {
    id: "payment",
    number: "4",
    title: "Payment Terms",
    content: [
      "• THEUNOiA LLP shall charge 5% (five percent) commission from the Client on the total contract value.",
      "• Payments shall be made to THEUNOiA LLP, which will release the Freelancer's payment after deducting applicable commissions."
    ]
  },
  {
    id: "obligations",
    number: "5",
    title: "Client Obligations",
    content: [
      "• The Client shall provide clear instructions, requirements, and timelines.",
      "• The Client shall not directly engage or pay the Freelancer outside THEUNOiA LLP during or after the project period.",
      "• The Client shall review and approve work within a reasonable time."
    ]
  },
  {
    id: "disputes",
    number: "6",
    title: "Dispute Resolution",
    content: [
      "• In case of any dispute related to quality, delivery, payment, delay, or misunderstanding between the Client and the Freelancer, ONLY THEUNOiA LLP shall intervene and resolve the issue.",
      "• The Client agrees to cooperate fully with THEUNOiA LLP during dispute resolution.",
      "• THEUNOiA's decision shall be final and binding."
    ]
  },
  {
    id: "liability",
    number: "7",
    title: "Limitation of Liability",
    content: [
      "• THEUNOiA LLP shall not be responsible for any indirect or consequential loss.",
      "• THEUNOiA's role is limited to facilitation, payment management, and dispute resolution."
    ]
  },
  {
    id: "termination",
    number: "8",
    title: "Termination",
    content: [
      "• THEUNOiA LLP reserves the right to terminate the Agreement if the Client violates terms or misuses the platform.",
      "• Pending dues must be cleared upon termination."
    ]
  },
  {
    id: "law",
    number: "9",
    title: "Governing Law",
    content: [
      "This Agreement shall be governed by and interpreted in accordance with the laws of India, and courts at Chandrapur shall have exclusive jurisdiction."
    ]
  },
  {
    id: "non-circumvention",
    number: "10",
    title: "Non-Circumvention",
    content: [
      "Any attempt by the Client or the Freelancer to bypass THEUNOiA LLP, including direct engagement, payment, or communication outside the platform for the same or related work, shall be treated as a material breach of this Agreement.",
      "THEUNOiA LLP reserves the right to take appropriate action, including suspension or permanent banning of the concerned account, recovery of losses, and initiation of legal proceedings as per applicable laws of India."
    ]
  },
  {
    id: "acceptance",
    number: "11",
    title: "Acceptance",
    content: [
      "By checking the agreement checkbox while posting a project, the Client confirms agreement to all terms stated herein.",
      "Contact: official@theunoia.com | +91 6372414583"
    ]
  }
];

const getFreelancerSections = (): Section[] => [
  {
    id: "parties",
    number: "1",
    title: "Parties",
    content: [
      "This Agreement is entered into between:",
      "THEUNOiA LLP, a Limited Liability Partnership registered under the Limited Liability Partnership Act, 2008, having its registered office at C/O NILKANTH, LAXMI NAGAR, CHANDRAPUR, MAHARASHTRA - 442401",
      "AND",
      "Freelancer (You)"
    ]
  },
  {
    id: "nature",
    number: "2",
    title: "Nature of Work",
    content: [
      "The Freelancer agrees to provide freelance services including assignments, projects, academic work, technical work, creative work, or any other services allotted through THEUNOiA LLP.",
      "The Freelancer is an \"independent contractor\" and not an employee of THEUNOiA LLP."
    ]
  },
  {
    id: "project",
    number: "3",
    title: "Project Details",
    content: [
      "• The project shall be awarded through a bidding process.",
      "• THEUNOiA LLP shall be entitled to charge a commission of five percent (5%) on the total project value as accepted or finalized through the bidding or approval process.",
      "• Upon acceptance of the bid or finalization of the project amount, THEUNOiA LLP shall deduct five percent (5%) of the agreed project value as its commission.",
      "• The student freelancer expressly agrees that the commission charged by THEUNOiA LLP is towards platform facilitation, client acquisition, administrative support, compliance handling, and operational coordination."
    ]
  },
  {
    id: "payment",
    number: "4",
    title: "Payment Terms",
    content: [
      "THEUNOiA LLP shall charge 3% (three percent) commission from the Freelancer on the total contract value.",
      "The remaining amount shall be payable to the Freelancer after successful completion of work and approval by the Client.",
      "Payments shall be processed only through THEUNOiA's approved payment method."
    ]
  },
  {
    id: "obligations",
    number: "5",
    title: "Obligations",
    content: [
      "• The Freelancer shall complete the work honestly, independently, and within the agreed timeline.",
      "• The Freelancer shall not share any client data, work material, or project details with third parties.",
      "• Any delay or failure in work must be immediately informed to THEUNOiA LLP."
    ]
  },
  {
    id: "disputes",
    number: "6",
    title: "Dispute Resolution",
    content: [
      "In case of any dispute, misunderstanding, delay, non-payment, or quality related issue between the Client and the Freelancer, ONLY THEUNOiA LLP shall have the authority to intervene, mediate, and resolve the matter.",
      "The decision of THEUNOiA LLP shall be final and binding on the Freelancer."
    ]
  },
  {
    id: "termination",
    number: "7",
    title: "Termination",
    content: [
      "THEUNOiA LLP reserves the right to terminate this Agreement in case of misconduct, breach of terms, or non-performance.",
      "Upon termination, pending payments shall be settled after deducting applicable commission."
    ]
  },
  {
    id: "acknowledgement",
    number: "8",
    title: "Acknowledgement",
    content: [
      "The Parties hereby acknowledge that they have read, understood, and agree to strictly adhere to all the terms and conditions.",
      "Any modification or amendment to this Agreement shall be valid only if made in writing and duly approved by THEUNOiA LLP.",
      "The Parties agree not to bypass or circumvent THEUNOiA LLP by engaging directly with each other for the same or similar work during the term of this Agreement."
    ]
  },
  {
    id: "non-circumvention",
    number: "9",
    title: "Non-Circumvention",
    content: [
      "Any attempt by the Client or the Freelancer to bypass THEUNOiA LLP, including direct engagement, payment, or communication outside the platform for the same or related work, shall be treated as a material breach of this Agreement.",
      "THEUNOiA LLP reserves the right to take appropriate action, including suspension or permanent banning of the concerned account, recovery of losses, and initiation of legal proceedings as per applicable laws of India."
    ]
  },
  {
    id: "acceptance",
    number: "10",
    title: "Acceptance",
    content: [
      "By checking the agreement checkbox while placing a bid, the Freelancer confirms that they have read, understood, and agreed to all the terms of this Agreement.",
      "Contact: official@theunoia.com | +91 6372414583"
    ]
  }
];

export function AgreementDialog({ open, onOpenChange, type, onAccept, showAcceptButton = false, onAllSectionsAccepted }: AgreementDialogProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [acceptedUpTo, setAcceptedUpTo] = useState(-1);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sections = type === "terms" ? getTermsSections() : type === "client" ? getClientSections() : getFreelancerSections();
  const title = type === "client" ? "Client Service Agreement" : type === "freelancer" ? "Freelancer Agreement" : "Terms & Conditions";
  const effectiveDate = "January 20, 2026";
  const isTermsSectionBySection = type === "terms" && typeof onAllSectionsAccepted === "function";
  /** Signup terms dialog: slightly reduced (medium) size, not full width */
  const isMediumSize = isTermsSectionBySection;

  useEffect(() => {
    if (open && isTermsSectionBySection) {
      setActiveSection(0);
      setAcceptedUpTo(-1);
    }
  }, [open, isTermsSectionBySection]);

  const scrollToSection = (index: number) => {
    if (isTermsSectionBySection) {
      // Only allow going to sections that are accepted or the immediate next one (must accept in order)
      if (index > acceptedUpTo + 1) return;
      setActiveSection(index);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      return;
    }
    const element = sectionRefs.current[index];
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({ top: elementTop - 20, behavior: 'smooth' });
    }
    setActiveSection(index);
  };

  useEffect(() => {
    if (isTermsSectionBySection && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeSection, isTermsSectionBySection]);

  useEffect(() => {
    if (isTermsSectionBySection) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      let current = 0;
      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const offsetTop = ref.offsetTop - container.offsetTop - 100;
          if (scrollTop >= offsetTop) current = index;
        }
      });
      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sections, isTermsSectionBySection]);

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onOpenChange(false);
  };

  const handleAcceptCurrentSection = () => {
    setAcceptedUpTo(activeSection);
    if (activeSection < sections.length - 1) {
      const nextIndex = activeSection + 1;
      scrollToSection(nextIndex);
      setActiveSection(nextIndex);
    } else {
      onAllSectionsAccepted?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden bg-background",
          isMediumSize ? "max-w-4xl max-h-[88vh]" : "max-w-5xl max-h-[90vh]"
        )}
      >
        <div className={cn("flex", isMediumSize ? "h-[80vh]" : "h-[85vh]")}>
          {/* Sidebar Navigation */}
          <div className={cn("bg-muted/30 border-r border-border flex flex-col shrink-0", isMediumSize ? "w-52" : "w-56")}>
            {/* THEUNOiA Logo */}
            <div className="p-4 border-b border-border flex items-center justify-center">
              <img src="/images/theunoia-logo.png" alt="THEUNOiA" className="h-10 object-contain" />
            </div>
            
            {/* Navigation Items */}
            <ScrollArea className="flex-1 py-2">
              <nav className="space-y-1 px-2">
                {sections.map((section, index) => {
                  const isAccepted = isTermsSectionBySection && acceptedUpTo >= index;
                  const isLocked = isTermsSectionBySection && index > acceptedUpTo + 1;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => scrollToSection(index)}
                      className={cn(
                        "w-full flex items-start gap-3 px-2 py-2.5 text-left rounded-lg transition-all",
                        activeSection === index
                          ? "bg-primary/10"
                          : !isLocked && "hover:bg-muted/50",
                        isLocked && "cursor-not-allowed opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="relative flex items-center">
                        {activeSection === index && (
                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-r" />
                        )}
                        <span className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium shrink-0",
                          activeSection === index
                            ? "bg-primary/20 text-primary"
                            : isAccepted
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                        )}>
                          {isAccepted && isTermsSectionBySection ? "✓" : section.number}
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm leading-tight pt-1",
                        activeSection === index
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}>
                        {section.title}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border">
              <h1 className="text-2xl font-bold text-secondary">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                EFFECTIVE DATE: {effectiveDate.toUpperCase()}
              </p>
            </div>

            {/* Scrollable Content: section-by-section = only current section (scroll within it); otherwise all sections */}
            <div
              ref={scrollContainerRef}
              className={cn(
                "flex-1 overflow-y-auto px-8 py-6 min-h-0",
                isTermsSectionBySection && "flex flex-col"
              )}
            >
              {isTermsSectionBySection ? (
                (() => {
                  const section = sections[activeSection];
                  if (!section) return null;
                  return (
                    <div className="mb-8">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-lg font-semibold text-secondary">
                          {section.number.padStart(2, '0')}.
                        </span>
                        <h2 className="text-lg font-semibold text-foreground">
                          {section.title}
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-secondary/30 via-accent/30 to-transparent" />
                      </div>
                      <div className="space-y-4 pl-10">
                        {section.content.map((paragraph, pIndex) => (
                          <p
                            key={pIndex}
                            className="text-muted-foreground leading-relaxed whitespace-pre-line"
                          >
                            {paragraph.split('**').map((part, i) =>
                              i % 2 === 1 ? (
                                <strong key={i} className="text-foreground font-semibold">{part}</strong>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                sections.map((section, index) => (
                  <div
                    key={section.id}
                    ref={(el) => (sectionRefs.current[index] = el)}
                    className="mb-12"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-lg font-semibold text-secondary">
                        {section.number.padStart(2, '0')}.
                      </span>
                      <h2 className="text-lg font-semibold text-foreground">
                        {section.title}
                      </h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-secondary/30 via-accent/30 to-transparent" />
                    </div>
                    <div className="space-y-4 pl-10">
                      {section.content.map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className="text-muted-foreground leading-relaxed whitespace-pre-line"
                        >
                          {paragraph.split('**').map((part, i) =>
                            i % 2 === 1 ? (
                              <strong key={i} className="text-foreground font-semibold">{part}</strong>
                            ) : (
                              part
                            )
                          )}
                        </p>
                      ))}
                    </div>
                    {index < sections.length - 1 && (
                      <div className="flex justify-center mt-8">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-secondary/40 to-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-border bg-muted/20 flex items-center justify-end">
              {isTermsSectionBySection ? (
                <Button
                  onClick={handleAcceptCurrentSection}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
                >
                  Accept agreement
                </Button>
              ) : showAcceptButton ? (
                <Button 
                  onClick={handleAccept}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
                >
                  ACCEPT AGREEMENT
                </Button>
              ) : (
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
