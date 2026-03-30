import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [freelancer, setFreelancer] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [phase, setPhase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      if (!id) return;
      
      // 1. Fetch Invoice
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
        
      if (invError) throw invError;
      const data: any = invData;
      setInvoice(data);

      // 2. Fetch related details in parallel to avoid FK naming conflicts
      const [
        { data: clientData },
        { data: freelancerData },
        { data: projectData }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', data.client_id).single(),
        supabase.from('user_profiles').select('*').eq('user_id', data.freelancer_id).single(),
        supabase.from('user_projects').select('id, title').eq('id', data.project_id).single()
      ]);

      setClient(clientData);
      setFreelancer(freelancerData);
      setProject(projectData);

      if (data.phase_id) {
        const { data: phaseData } = await supabase.from('project_phases').select('*').eq('id', data.phase_id).single();
        setPhase(phaseData);
      }

    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <p>Invoice not found.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const handleDownload = async () => {
    const input = document.getElementById("invoice-document");
    if (!input) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(input, {
        scale: 2, // Higher quality
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoice_number}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 print:py-0 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation / Actions (Hidden in Print) */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
              invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
              invoice.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-200 text-slate-700'
            }`}>
              {invoice.status}
            </span>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-100">
              <Download className="w-4 h-4" /> {downloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* Invoice Paper Document */}
        <div id="invoice-document" className="bg-white p-10 md:p-14 rounded-2xl shadow-xl print:shadow-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-14 border-b pb-8 border-slate-200">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">THEUNOiA</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Platform Service Invoice</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-wide">Invoice</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 text-right">
                <span className="font-semibold text-slate-400">Invoice Number:</span>
                <span className="font-medium text-slate-900">{invoice.invoice_number}</span>
                <span className="font-semibold text-slate-400">Invoice Date:</span>
                <span className="font-medium text-slate-900">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</span>
                <span className="font-semibold text-slate-400">Contract ID:</span>
                <span className="font-medium text-slate-900">{project?.id.split('-')[0] || 'N/A'}</span>
                {phase && (
                  <>
                    <span className="font-semibold text-slate-400">Phase Number:</span>
                    <span className="font-medium text-slate-900">0{phase.phase_order}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Supplier & Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
            {/* Supplier */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 pb-2 border-b border-slate-100">
                Supplier (Freelancer)
              </h3>
              <p className="font-extrabold text-slate-900 mb-2">
                {freelancer?.first_name} {freelancer?.last_name}
              </p>
              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <p>{freelancer?.residential_address || freelancer?.registered_address || 'Address not provided'}</p>
                {/* Fallback to profile state if not found */}
                <p>{freelancer?.city ? `${freelancer.city}, ` : ''}{freelancer?.state || 'State N/A'}</p>
                {freelancer?.pan_number && <p className="pt-2"><span className="font-semibold text-slate-500">PAN:</span> {freelancer.pan_number}</p>}
                {freelancer?.gstin && <p className="pt-1"><span className="font-semibold text-slate-500">GSTIN:</span> {freelancer.gstin}</p>}
              </div>
            </div>

            {/* Bill To */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 pb-2 border-b border-slate-100">
                Bill To (Client)
              </h3>
              <p className="font-extrabold text-slate-900 mb-2">
                {client?.first_name} {client?.last_name}
              </p>
              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <p>{client?.registered_address || client?.residential_address || 'Address not provided'}</p>
                <p>{client?.city ? `${client.city}, ` : ''}{client?.state || 'State N/A'}</p>
                {client?.gstin && <p className="pt-2"><span className="font-semibold text-slate-500">GSTIN:</span> {client.gstin}</p>}
              </div>
            </div>
          </div>

          {/* Service Details Table */}
          <div className="mb-14">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Service Details</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 border-b border-slate-200 w-3/5">Description</th>
                    <th className="px-5 py-4 border-b border-slate-200 w-1/5 text-center">Phase No.</th>
                    <th className="px-5 py-4 border-b border-slate-200 w-1/5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="px-5 py-6 text-slate-700 font-medium border-b border-slate-100">
                      Service for {invoice.invoice_type === 'advance_payment' ? 'Advance Payment' : `Phase ${phase?.phase_order || ''}`} of Contract {project?.id.split('-')[0] || ''}
                      <p className="text-xs text-slate-400 mt-1 font-normal">{project?.title}</p>
                    </td>
                    <td className="px-5 py-6 text-slate-600 text-center border-b border-slate-100 font-medium">
                      {phase?.phase_order || '-'}
                    </td>
                    <td className="px-5 py-6 text-slate-900 font-bold text-right border-b border-slate-100">
                      {(invoice.subtotal_amount || invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="w-full md:w-1/2 ml-auto mb-16">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-600 pb-4 border-b border-slate-100">
                <span className="font-semibold">Sub-total</span>
                <span className="font-bold text-slate-900">₹{(invoice.subtotal_amount || invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              {(invoice.gst_amount > 0 || (freelancer?.gstin && freelancer.gstin.trim() !== '')) && (
                <div className="flex justify-between text-sm text-slate-600 pb-4 border-b border-slate-100">
                  <span className="font-semibold">GST @ 18%</span>
                  <span className="font-bold text-slate-900">₹{invoice.gst_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-4 bg-slate-50 px-5 rounded-xl border border-slate-100">
                <span className="font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Total Payable</span>
                <span className="font-extrabold text-xl text-primary-purple">₹{(invoice.total_amount || invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-200 mt-auto">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Authorised for THEUNOiA Platform</p>
            <p className="text-[10px] text-slate-400 italic">This is a system-generated document.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
