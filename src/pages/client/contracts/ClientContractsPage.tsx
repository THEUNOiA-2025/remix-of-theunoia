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
    residential_address: string | null;
    registered_address: string | null;
    city: string | null;
    pin_code: string | null;
    pan: string | null;
    gstin: string | null;
    client_contract_signed: boolean | null;
    signature_url: string | null;
}

const ClientContractsPage = () => {
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
                    .select('first_name, last_name, residential_address, registered_address, city, pin_code, pan, gstin, client_contract_signed, signature_url')
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

        if (!profile?.client_contract_signed && isCanvasEmpty) {
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
                    client_contract_signed: true,
                    ...(signatureUrl ? { signature_url: signatureUrl } : {})
                })
                .eq('user_id', user.id);

            if (error) throw error;

            setProfile(prev => prev ? { ...prev, client_contract_signed: true, signature_url: signatureUrl } : null);
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
    const primaryAddress = profile?.residential_address || profile?.registered_address;
    const addressParts = [primaryAddress, profile?.city, profile?.pin_code].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'NIL';
    const pan = profile?.pan || 'NIL';
    const gstin = profile?.gstin || 'NIL';

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
                        Client Service Agreement
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium pr-10">
                        Please review and accept the terms of the client service agreement to proceed with projects on THEUNOiA.
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
                        <h2 className="text-2xl font-black uppercase tracking-wider text-black mb-2">CLIENT SERVICE AGREEMENT</h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Between THEUNOiA LLP and the Client</p>
                        <p className="text-xs text-muted-foreground italic mt-1">(Under the Indian Contract Act, 1872)</p>
                    </div>

                    <p className="mb-6 bg-primary/5 p-4 rounded-lg font-bold">
                        This Client Service Agreement ("Agreement") is executed on this <span className="underline decoration-primary decoration-2 underline-offset-4 mx-1 px-1">{day}</span> day of <span className="underline decoration-primary decoration-2 underline-offset-4 mx-1 px-1">{month}</span> <span className="underline decoration-primary decoration-2 underline-offset-4 mx-1 px-1">{year}</span> ("Effective Date")
                    </p>

                    <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">BY AND BETWEEN</h3>

                    <div className="bg-muted/30 p-5 rounded-lg border-l-4 border-primary mb-6">
                        <p className="mb-4">
                            <strong className="text-black">THEUNOiA</strong>, a digital marketplace platform operated under the laws of India, having its registered office at M/S THEUNOiA LLP C/O Nilkanth, Laxmi Nagar Chandrapur, Maharashtra – 442401 (hereinafter referred to as "THEUNOiA", "Platform", or "Service Provider", which expression shall, unless repugnant to the context, include its successors and permitted assigns);
                        </p>
                        <p className="font-bold text-center my-4 uppercase tracking-widest text-muted-foreground">AND</p>
                        <p className="leading-relaxed">
                            Client Name: <strong className="text-black underline decoration-primary/30 decoration-2 underline-offset-4 text-lg">{fullName}</strong><br />
                            Address: <span className="underline decoration-primary/30 decoration-2 underline-offset-4">{fullAddress}</span><br />
                            PAN: <span className="underline decoration-primary/30 decoration-2 underline-offset-4 font-mono font-bold mr-2">{pan}</span>
                            GSTIN: <span className="underline decoration-primary/30 decoration-2 underline-offset-4 font-mono font-bold">{gstin}</span><br />
                            (hereinafter referred to as the "Client", which expression shall include their heirs, legal representatives, and permitted assigns).
                        </p>
                    </div>

                    <p className="mb-8 italic text-muted-foreground">
                        THEUNOiA and the Client are hereinafter collectively referred to as the "Parties" and individually as a "Party".
                    </p>

                    <div className="space-y-8">
                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">1. Nature of Engagement</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">1.1</span> <span>The Client agrees to engage THEUNOiA for facilitating professional services through independent contractors/freelancers registered on the Platform.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">1.2</span> <span>Nothing contained herein shall be construed to create any employer-employee relationship, partnership, joint venture, or agency between THEUNOiA, the Freelancer, and the Client, except as explicitly stated in the Platform’s Terms and Conditions.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">2. Scope of Services</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">2.1</span> <span>THEUNOiA agrees to facilitate the delivery of services accurately defined by the Client under specific project requirements on the Platform.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">2.2</span> <span>All projects shall strictly follow the Phase-Based Project Structure as defined in THEUNOiA’s Terms and Conditions.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">2.3</span> <span>The Client remains fully responsible for providing timely feedback, approvals, and any necessary resources required for the Freelancer to complete the project phases.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">3. Platform Fees & Payment Structure</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.1</span> <span>The Client acknowledges that all costs, fees, and charges for any project are bound by THEUNOiA’s pricing model.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.2</span> <span>To initiate any phase of a project, the Client must make an advanced payment corresponding to that specific phase as outlined in the accepted project proposal.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">3.3</span> <span>Such advanced payments are held securely and released only upon the respective completion and approval of the phase deliverables.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">3.4</span>
                                    <div className="flex-1 bg-secondary/20 p-4 rounded-lg italic text-secondary-foreground font-medium border-l-2 border-secondary">
                                        "The Client acknowledges that THEUNOiA follows a phased project execution and payment system, the complete details of which are set out in the Terms and Conditions... By accepting and executing this Agreement, the Client confirms that they have read, understood, and agreed to be legally bound by all such policies and terms, including the phased system and the related advanced payment structure."
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">4. Payment Conditions</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">4.1</span> <span>All payments to Freelancers must be processed exclusively through THEUNOiA's integrated payment system.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">4.2</span> <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Off-platform payments or any attempts to independently transact with Freelancers are strictly prohibited.</span></li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary min-w-[24px]">4.3</span>
                                    <div className="flex-1">
                                        <p className="mb-2">Attempting to bypass the Platform payment mechanism shall constitute a material breach and may result in:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-red-500">
                                            <li>Immediate suspension or termination of the Client account.</li>
                                            <li>Legal recovery proceedings for lost commission and damages.</li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">5. Review & Approval</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">5.1</span> <span>The Client shall review deliverables submitted by the Freelancer for each phase promptly.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">5.2</span> <span>If deliverables meet the agreed specifications, the Client must approve the phase, authorizing the release of the advanced payment to the Freelancer.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">5.3</span> <span>In case of non-responsiveness from the Client after a specified period as outlined in the Platform policies, THEUNOiA reserves the right to automatically approve and release funds.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">6. Taxation & Invoicing</h4>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">6.1</span> <span>THEUNOiA shall issue formal invoices for all payments made by the Client.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">6.2</span> <span>Applicable GST and other statutory taxes will be levied as per Indian regulations.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">7. Dispute Resolution</h4>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">7.1</span> <span>Disputes arising under this Agreement shall first be attempted to be resolved amicably through the Platform’s dispute resolution center.</span></li>
                                <li className="flex gap-3"><span className="font-bold text-primary min-w-[24px]">7.2</span> <span>If disputes relate to deliverables, THEUNOiA provides arbitration services based on the specific project scope and communication logs. Decisions made by THEUNOiA's arbitration team are final.</span></li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">8. Governing Law & Jurisdiction</h4>
                            <div className="pl-[36px]">
                                <p>This Agreement shall be governed by the laws of India.</p>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-black/10 pb-2 mb-3 text-primary">9. Acknowledgment of Platform Policies</h4>
                            <div className="pl-[36px]">
                                <p className="mb-2">The Client expressly acknowledges that:</p>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary">
                                    <li>a) They have read and understood THEUNOiA's Terms & Conditions and privacy policy.</li>
                                    <li>b) Detailed operational procedures, dispute mechanisms, data handling practices, and compliance frameworks are elaborated therein.</li>
                                    <li>c) These policies form an integral part of this Agreement.</li>
                                    <li>d) Failure to review these policies shall not exempt the Client from obligations therein.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="bg-primary/5 p-6 rounded-xl border border-primary/20 mt-8 shadow-inner">
                            <h4 className="text-base font-bold uppercase tracking-wider border-b border-primary/20 pb-2 mb-4 text-primary">10. Acceptance</h4>
                            <div className="space-y-4 font-medium text-black">
                                <p>By proceeding with payment or engaging a freelancer on THEUNOiA, the Client agrees to be legally bound by this Agreement. These are further articulated in terms and conditions.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-6 border-t border-primary/20 not-italic">
                                    <div className="space-y-1">
                                        <p className="font-bold uppercase tracking-wider text-muted-foreground text-xs mb-2">For THEUNOiA LLP</p>
                                        <p className="font-mono text-lg font-bold">Authorized Signatory</p>
                                        <p>Name: <strong>Sai krishnan</strong></p>
                                        <p>Designation: <strong>Founder & Managing Director of THEUNOiA</strong></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold uppercase tracking-wider text-muted-foreground text-xs mb-2">Client</p>
                                        {profile?.client_contract_signed ? (
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
                    {profile?.client_contract_signed ? (
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

export default ClientContractsPage;
