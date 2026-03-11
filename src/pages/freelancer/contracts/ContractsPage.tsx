import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
    first_name: string;
    last_name: string;
    pan: string | null;
    gstin: string | null;
    contract_signed: boolean | null;
    signature_url: string | null;
}

const ContractsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);

    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

    const handleClearSignature = () => {
        sigCanvas.current?.clear();
        setIsCanvasEmpty(true);
    };

    const handleEndStroke = () => {
        setIsCanvasEmpty(sigCanvas.current?.isEmpty() ?? true);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('first_name, last_name, pan, gstin, contract_signed, signature_url')
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;
                setProfile(data as UserProfile);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSignContract = async () => {
        if (!user) return;

        if (!profile?.contract_signed && isCanvasEmpty) {
            toast.error('Please provide your signature before accepting.');
            return;
        }

        setSigning(true);
        try {
            let signatureUrl = profile?.signature_url || null;

            if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const fileName = `signatures/${user.id}-${Date.now()}.png`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project-images')
                    .upload(fileName, blob, { contentType: 'image/png' });

                if (uploadError) {
                    throw new Error('Failed to upload signature image: ' + uploadError.message);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('project-images')
                    .getPublicUrl(fileName);

                signatureUrl = publicUrl;
            }

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    contract_signed: true,
                    ...(signatureUrl ? { signature_url: signatureUrl } : {})
                })
                .eq('user_id', user.id);

            if (error) throw error;

            setProfile(prev => prev ? { ...prev, contract_signed: true, signature_url: signatureUrl } : null);
            toast.success('Contract signed successfully!');
        } catch (error: any) {
            console.error('Error signing contract:', error);
            toast.error(error.message || 'Failed to sign contract');
        } finally {
            setSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '________________________';
    const pan = profile?.pan || 'NIL';
    const gstin = profile?.gstin || '_____________';

    return (
        <div className="flex-1 p-5 overflow-y-auto w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6 relative">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="absolute -left-12 lg:-left-16 p-2 rounded-full hover:bg-black/5 transition-colors"
                    title="Back to Dashboard"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <FileCheck className="w-8 h-8 text-primary" />
                        Independent Contractor Agreement
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium pr-10">
                        Please review and accept the terms of the independent contractor agreement to proceed with projects on THEUNOiA.
                    </p>
                </div>
            </div>

            <Card className="p-8 bg-white shadow-sm border border-black/10 rounded-xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileCheck className="w-64 h-64 text-primary" />
                </div>

                <div className="prose prose-sm max-w-none text-foreground/90 font-medium leading-relaxed relative z-10 selection:bg-primary/20">
                    <div className="text-center mb-10 border-b border-black/10 pb-6">
                        <h2 className="text-2xl font-black uppercase tracking-wider text-black mb-2">Independent Contractor Agreement</h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Between THEUNOiA LLP and the Independent Contractor</p>
                        <p className="text-xs text-muted-foreground italic mt-1">(Under the Indian Contract Act, 1872)</p>
                    </div>

                    <p className="mb-6 bg-primary/5 p-4 rounded-lg font-bold">
                        This Independent Contractor Agreement ("Agreement") is executed on this <span className="underline decoration-primary decoration-2 underline-offset-4 mx-1 px-1">{day}</span> day of <span className="underline decoration-primary decoration-2 underline-offset-4 mx-1 px-1">{month}</span> <span className="underline decoration-primary decoration-2 underline-offset-4 mx-1 px-1">{year}</span> ("Effective Date")
                    </p>

                    <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">BY AND BETWEEN</h3>

                    <div className="bg-muted/30 p-5 rounded-lg border-l-4 border-primary mb-6">
                        <p className="mb-4">
                            <strong className="text-black">THEUNOiA</strong>, a digital marketplace platform operated under the laws of India, having its registered office at M/S THEUNOiA LLP C/O Nilkanth, Laxmi Nagar Chandrapur, Maharashtra – 442401 (hereinafter referred to as "THEUNOiA" or "Platform", which expression shall, unless repugnant to the context, include its successors and permitted assigns);
                        </p>
                        <p className="font-bold text-center my-4 uppercase tracking-widest text-muted-foreground">AND</p>
                        <p>
                            <strong className="text-black underline decoration-primary/30 decoration-2 underline-offset-4 text-lg">{fullName}</strong>,
                            holding PAN <span className="underline decoration-primary/30 decoration-2 underline-offset-4 font-mono font-bold">{pan}</span>
                            {gstin !== '_____________' && <span> (and GSTIN <span className="underline decoration-primary/30 decoration-2 underline-offset-4 font-mono font-bold">{gstin}</span>)</span>},
                            (hereinafter referred to as the "Independent Contractor", which expression shall include his/her heirs, legal representatives and permitted assigns).
                        </p>
                    </div>

                    <p className="mb-8 italic text-muted-foreground">
                        THEUNOiA and the Independent Contractor are hereinafter collectively referred to as the "Parties" and individually as a "Party".
                    </p>

                    <div className="space-y-8">
                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">1. Nature of Engagement</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">1.1</span> <span>The Independent Contractor agrees to provide professional services to clients sourced through THEUNOiA strictly as an independent contractor.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">1.2</span> <span>Nothing contained herein shall be construed to create any employer employee relationship, partnership, joint venture, agency, or fiduciary relationship between THEUNOiA and the Independent Contractor.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">1.3</span> <span>The Independent Contractor shall have full control over the manner and method of performing services, subject to compliance with Platform policies and agreed project scope. As set forth in the Terms and Conditions of the Platform & as directed by THEUNOiA.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">2. Scope of Services</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">2.1</span> <span>The Freelancer agrees to provide services listed under the skills registered on the THEUNOiA Platform.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">2.2</span>
                                    <div className="flex-1">
                                        <p className="mb-2">The Freelancer shall:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>Deliver services professionally and within agreed timelines</li>
                                            <li>Comply with project specifications uploaded on the Platform</li>
                                            <li>Follow all Platform policies, quality standards, and compliance requirements</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">2.3</span> <span>All projects shall follow the Phase-Based Project Structure as defined in THEUNOiA’s Terms and Conditions.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">3. Platform Fees & Payment Structure</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.1</span> <span>In consideration for marketplace access, infrastructure, payment facilitation, compliance systems, and dispute resolution mechanisms, THEUNOiA shall deduct a <strong className="text-black bg-primary/10 px-1 rounded">5% Platform Fee</strong> from the total contract value of each project.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.2</span> <span>Applicable GST on the Platform Fee shall also be deducted as per law.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.3</span> <span>Statutory deductions including TDS and TCS (where applicable under law) shall be deducted in accordance with applicable legislation.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.4</span> <span>A detailed settlement breakdown shall be made available in the Freelancer dashboard.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.5</span> <span>The Freelancer acknowledges that Platform Fees are independent of statutory tax deductions.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.6</span> <span>THEUNOiA reserves the right to revise Platform Fees prospectively. Ongoing accepted projects shall not be affected.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">3.7</span>
                                    <div className="flex-1 bg-secondary/20 p-4 rounded-lg italic text-secondary-foreground font-medium border-l-2 border-secondary">
                                        "The Independent Contractor/Freelancer acknowledges that THEUNOiA follows a phased project execution and payment system, the complete details of which are set out in the Terms and Conditions, Privacy Policy, and the Specialized Terms and Conditions applicable to each skill. By accepting and executing this Agreement, the Independent Contractor/Freelancer confirms that they have read, understood, and agreed to be legally bound by all such policies and terms, including the phased system and the related payment structure."
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">4. Payment Conditions</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">4.1</span> <span>All payments must be processed exclusively through THEUNOiA's integrated payment system.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">4.2</span> <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Off platform payments are strictly prohibited.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">4.3</span>
                                    <div className="flex-1">
                                        <p className="mb-2">Attempting to bypass the Platform payment mechanism shall constitute a material breach and may result in:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-red-500">
                                            <li>Immediate suspension</li>
                                            <li>Permanent account termination</li>
                                            <li>Legal recovery proceedings</li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                        </section>

                        {/* Abbreviated sections for brevity, adding full text from document */}
                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">5. Taxation & Invoicing</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">5.1</span>
                                    <div className="flex-1">
                                        <p className="mb-2">If registered under GST, the Freelancer shall:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>Issue GST-compliant invoices</li>
                                            <li>Correctly calculate and charge GST</li>
                                            <li>File returns and deposit GST with the Government</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">5.2</span> <span>THEUNOiA shall charge GST on Platform commission as per applicable law.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">5.3</span>
                                    <div className="flex-1">
                                        <p className="mb-2">Where required under Income Tax Act:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>TDS may apply</li>
                                            <li>The Freelancer acknowledges compliance obligations</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">5.4</span>
                                    <div className="flex-1">
                                        <p className="mb-2">Where required under GST law:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>TCS may be collected and deposited</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">5.5</span> <span>THEUNOiA acts only as an intermediary and shall not assume statutory tax liability of the Freelancer.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">6. Data Access, Monitoring & Platform Control</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">6.1</span>
                                    <div className="flex-1">
                                        <p className="mb-2">THEUNOiA retains administrative access to Platform data including:</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="bg-muted px-2 py-1 rounded text-xs">Messages</span>
                                            <span className="bg-muted px-2 py-1 rounded text-xs">Files</span>
                                            <span className="bg-muted px-2 py-1 rounded text-xs">Project documents</span>
                                            <span className="bg-muted px-2 py-1 rounded text-xs">Transaction records</span>
                                            <span className="bg-muted px-2 py-1 rounded text-xs">Communication logs</span>
                                        </div>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">6.2</span>
                                    <div className="flex-1">
                                        <p className="mb-2">Such access may be exercised for:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>Dispute resolution</li>
                                            <li>Fraud prevention</li>
                                            <li>Security monitoring</li>
                                            <li>Legal compliance</li>
                                            <li>Operational improvement</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">6.3</span> <span>Administrative access shall be limited to authorized personnel.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">6.4</span>
                                    <div className="flex-1">
                                        <p className="mb-2">The Freelancer shall not:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-red-600 marker:text-red-500 font-medium">
                                            <li>Manipulate</li>
                                            <li>Falsify</li>
                                            <li>Delete transaction logs</li>
                                            <li>Tamper with records</li>
                                        </ul>
                                        <p className="mt-2 font-bold text-red-600 bg-red-50 p-2 rounded">Violation shall be treated as material breach.</p>
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">7. Confidentiality</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">7.1</span>
                                    <div className="flex-1">
                                        <p className="mb-2">The Freelancer shall maintain strict confidentiality of:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>a) Platform systems</li>
                                            <li>b) Project details</li>
                                            <li>c) User data</li>
                                            <li>d) Proprietary processes</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">7.2</span> <span>Confidentiality obligations survive termination.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">8. Intellectual Property</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">8.1</span> <span>Ownership of project deliverables shall be governed by project-specific terms uploaded on the Platform.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">8.2</span> <span>The Freelancer retains no ownership rights unless explicitly agreed.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">9. Representations & Warranties</h4>
                            <div className="pl-[36px]">
                                <p className="mb-2">The Freelancer represents that:</p>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                    <li>All information provided is true and accurate</li>
                                    <li>They possess necessary qualifications and licenses</li>
                                    <li>They are legally competent to contract</li>
                                    <li>They shall comply with all applicable Indian laws</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">10. Suspension & Termination</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">10.1</span>
                                    <div className="flex-1">
                                        <p className="mb-2">THEUNOiA may suspend or terminate the Freelancer's account in case of:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>a) Policy violations</li>
                                            <li>b) Fraud or misconduct</li>
                                            <li>c) Tax non-compliance</li>
                                            <li>d) Attempt to bypass platform</li>
                                            <li>e) Reputational harm</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">10.2</span>
                                    <div className="flex-1">
                                        <p className="mb-2">Upon termination:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>Pending settlements shall be processed subject to deductions</li>
                                            <li>Access to Platform shall cease</li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">11. Limitation of Liability</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">11.1</span>
                                    <div className="flex-1">
                                        <p className="mb-2">THEUNOiA shall not be liable for:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                            <li>Indirect or consequential losses</li>
                                            <li>Tax penalties arising from Freelancer non-compliance</li>
                                            <li>Client disputes beyond Platform dispute mechanism</li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">12. Dispute Resolution</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">12.1</span> <span>Disputes arising under this Agreement shall first be attempted to be resolved amicably.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">12.2</span>
                                    <div className="flex-1 space-y-2">
                                        <p>THEUNOiA acts only as a facilitator between the Client and the Independent Contractor and shall not be liable for any disputes, claims, losses, or damages arising between them.</p>
                                        <p>The Client and the Independent Contractor may take legal action against each other independently, and THEUNOiA shall not be made a party to such disputes.</p>
                                        <p>However, any issue or grievance must first be notified to THEUNOiA in writing and reasonable time must be given for review before initiating legal proceedings.</p>
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">13. Governing Law & Jurisdiction</h4>
                            <div className="pl-[36px]">
                                <p>This Agreement shall be governed by the laws of India.</p>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">14. Acknowledgment of Platform Policies</h4>
                            <div className="pl-[36px]">
                                <p className="mb-2">The Freelancer expressly acknowledges that:</p>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                    <li>a) They have read and understood THEUNOiA's Terms & Conditions and privacy policy</li>
                                    <li>b) Detailed operational procedures, dispute mechanisms, data handling practices, and compliance frameworks are elaborated therein.</li>
                                    <li>c) These policies form an integral part of this Agreement</li>
                                    <li>d) Failure to review these policies shall not exempt the Freelancer from obligations therein.</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">15. Miscellaneous</h4>
                            <ul className="space-y-2 list-none pl-[36px]">
                                <li>a) This Agreement constitutes the entire understanding between Parties.</li>
                                <li>b) Amendments must be in writing. This Agreement may be amended, modified, or updated solely at the discretion of THEUNOiA LLP.</li>
                                <li>c) If any provision is held invalid, remaining provisions remain enforceable.</li>
                                <li>d) Electronic acceptance shall be legally binding under the Information Technology Act, 2000.</li>
                                <li>e) The Independent Contractor hereby represents and warrants that they are at least eighteen (18) years of age and legally competent to enter into this Agreement under applicable Indian law.</li>
                            </ul>
                            <div className="pl-[36px] mt-4 space-y-3 bg-muted/20 p-4 rounded-lg">
                                <p>In the event the Independent Contractor is below eighteen (18) years of age, the Contractor confirms that they are acting strictly under the supervision, consent, and legal responsibility of their parent or lawful guardian, and that such guardian has reviewed and accepted this Agreement, the Terms and Conditions, and the Privacy Policy of THEUNOiA.</p>
                                <p className="font-bold text-red-600">Any misrepresentation of age shall constitute a material breach and may result in immediate suspension or termination of access to the Platform.</p>
                            </div>
                        </section>

                        <section className="bg-primary/5 p-6 rounded-xl border border-primary/20 mt-8 shadow-inner">
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-primary/20 pb-2 mb-4 text-primary">16. Acceptance</h4>
                            <div className="space-y-4 font-medium text-black">
                                <p>By proceeding with payment or accepting a proposal on THEUNOiA, the independent contractor agrees to be legally bound by this Agreement. These are further articulated in terms and conditions.</p>
                                <div className="pl-4 border-l-4 border-primary/40 space-y-3 italic">
                                    <p>"The Independent Contractor/Freelancer acknowledges and agrees that THEUNOiA shall be entitled to deduct its applicable commission and/or service fee as specified under the Terms and Conditions from the agreed Project consideration."</p>
                                    <p>"The Parties acknowledge that all applicable taxes, statutory deductions, levies, and regulatory compliances, including commission structure and service fees, are governed by and detailed in THEUNOiA's Terms and Conditions and shall be applicable to this Contract accordingly."</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-6 border-t border-primary/20 not-italic">
                                    <div className="space-y-1">
                                        <p className="font-bold uppercase tracking-wider text-muted-foreground text-xs mb-2">For THEUNOiA LLP</p>
                                        <p className="font-mono text-lg font-bold">Authorized Signatory</p>
                                        <p>Name: <strong>Sai krishnan</strong></p>
                                        <p>Designation: <strong>Founder & Managing Director of THEUNOiA</strong></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold uppercase tracking-wider text-muted-foreground text-xs mb-2">Independence Contractor</p>
                                        {profile?.contract_signed ? (
                                            <div className="mb-4">
                                                {profile.signature_url && (
                                                    <img src={profile.signature_url} alt="Signature" className="h-16 mb-2" />
                                                )}
                                                <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-md font-bold my-2">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Contract Already Agreed
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <div className="border-2 border-dashed border-primary/20 bg-[#faf7f1] rounded-lg overflow-hidden w-full max-w-[250px] mb-2">
                                                    <SignatureCanvas
                                                        ref={sigCanvas}
                                                        onEnd={handleEndStroke}
                                                        penColor="black"
                                                        canvasProps={{
                                                            className: 'w-full h-24 cursor-crosshair',
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleClearSignature}
                                                    className="text-xs text-muted-foreground hover:text-red-500 font-medium transition-colors"
                                                >
                                                    Clear Signature
                                                </button>
                                            </div>
                                        )}
                                        <p>Name: <strong>{fullName}</strong></p>
                                        <p>Date: <strong>{`${month} ${day}, ${year}`}</strong></p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </Card>

            <div className="mt-8 flex justify-center sticky bottom-6 z-20">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-primary/20 inline-flex items-center gap-4 max-w-2xl w-full justify-between">
                    <div className="flex-1 pr-4">
                        <h4 className="font-bold text-sm tracking-wide">Agreement Confirmation</h4>
                        <p className="text-xs text-muted-foreground">By clicking accept, you agree to all the terms stated above.</p>
                    </div>
                    {profile?.contract_signed ? (
                        <Button disabled className="bg-green-600 opacity-100 flex items-center gap-2 px-8">
                            <CheckCircle2 className="w-5 h-5" />
                            Contract Already Agreed
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSignContract}
                            disabled={signing}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                            <FileCheck className="w-5 h-5" />
                            {signing ? 'Signing...' : 'I Accept and Sign'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractsPage;
