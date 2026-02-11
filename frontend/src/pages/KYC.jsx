import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser } from '../App';

export default function KYC() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  
  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [input, setInput] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Demography fields
  const [demoFirstname, setDemoFirstname] = useState('');
  const [demoLastname, setDemoLastname] = useState('');
  const [demoGender, setDemoGender] = useState('');
  const [demoDob, setDemoDob] = useState('');

  useEffect(() => {
    api.get('/kyc/services').then(r => setServices(r.data.services || [])).catch(() => {});
  }, []);

  const isDemography = service?.isMultiField || service?.id === 'nin-demography';

  const getPlaceholder = () => {
    if (!service) return 'Select service first';
    if (service.id.includes('phone')) return '08012345678 or 2348012345678';
    if (service.id.includes('tracking')) return 'e.g. 7Y0OG2ZO003KUPG';
    if (service.id.includes('bvn') && !service.id.includes('phone')) return 'Enter 11-digit BVN';
    return 'Enter 11-digit NIN';
  };

  const isValid = () => {
    if (!service || !consent) return false;
    if (service.price > (user?.balance || 0)) return false;
    
    // Demography validation
    if (isDemography) {
      return demoFirstname.trim() && demoLastname.trim() && demoGender && demoDob;
    }
    
    // Single field validation
    if (service.id.includes('phone')) {
      return /^0[789]\d{9}$/.test(input) || /^234[789]\d{9}$/.test(input);
    }
    if (service.id.includes('tracking')) return /^[A-Za-z0-9]{10,20}$/.test(input.trim());
    return /^\d{11}$/.test(input);
  };

  const verify = async () => {
    if (!isValid()) return;
    setError('');
    setLoading(true);
    
    try {
      let payload;
      
      if (isDemography) {
        payload = {
          firstname: demoFirstname.trim(),
          lastname: demoLastname.trim(),
          gender: demoGender,
          dob: demoDob,
          consent: true
        };
      } else {
        payload = { input: input.trim().toUpperCase(), consent: true };
        if (service.id.includes('phone')) payload.phone = input.trim();
        else if (service.id.includes('tracking')) payload.trackingId = input.trim().toUpperCase();
        else if (service.id.includes('bvn')) payload.bvn = input.trim();
        else payload.nin = input.trim();
      }
      
      const res = await api.post(`/kyc/verify/${service.id}`, payload);
      
      if (res.data.success && res.data.data) {
        setResult(res.data);
        await refreshUser();
      } else {
        setError(res.data.error || 'Verification failed');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Verification failed. Try again.');
    }
    setLoading(false);
  };

  const reset = () => {
    setResult(null);
    setInput('');
    setConsent(false);
    setError('');
    setDemoFirstname('');
    setDemoLastname('');
    setDemoGender('');
    setDemoDob('');
  };

  const printResult = () => window.print();

  const formatLabel = (key) => {
    const labels = {
      // NIN fields
      firstname: 'First Name', middlename: 'Middle Name', surname: 'Surname', lastname: 'Last Name',
      first_name: 'First Name', middle_name: 'Middle Name', last_name: 'Last Name',
      telephoneno: 'Phone', phone: 'Phone', mobile: 'Phone', phonenumber: 'Phone',
      phonenumber1: 'Phone', phonenumber2: 'Phone 2',
      gender: 'Gender', birthdate: 'Date of Birth', dob: 'Date of Birth', dateofbirth: 'Date of Birth',
      residence_state: 'State', residence_lga: 'LGA', residence_address: 'Address', residence_town: 'Town',
      birthstate: 'State of Origin', birthlga: 'LGA of Origin', birthcountry: 'Country',
      state_of_origin: 'State of Origin', state_of_residence: 'State of Residence',
      nin: 'NIN', bvn: 'BVN', email: 'Email', nationality: 'Nationality',
      maritalstatus: 'Marital Status', marital_status: 'Marital Status',
      title: 'Title', profession: 'Profession', nspokenlang: 'Language',
      trackingid: 'Tracking ID', tracking_id: 'Tracking ID',
      religion: 'Religion',
      // BVN specific fields (case insensitive matching)
      nameoncard: 'Name on Card', watchlisted: 'Watchlisted',
      levelofaccount: 'Account Level', lgaoforigin: 'LGA of Origin',
      lgaofresidence: 'LGA of Residence', stateoforigin: 'State of Origin',
      stateofresidence: 'State of Residence', registrationdate: 'Registration Date',
      enrollmentbank: 'Enrollment Bank', enrollmentbranch: 'Enrollment Branch'
    };
    const lowerKey = key.toLowerCase();
    if (labels[lowerKey]) return labels[lowerKey];
    // Convert camelCase/PascalCase to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  // ===========================================
  // RESULT SCREEN
  // ===========================================
  if (result && result.data) {
    let d = result.data;
    
    // If data is a string (JSON), try to parse it
    if (typeof d === 'string') {
      try { d = JSON.parse(d); } catch (e) { console.log('Parse error'); }
    }
    
    // If there's a nested 'data' object, use that instead
    if (d.data && typeof d.data === 'object') {
      d = d.data;
    }
    
    // Handle different API field name variations for name
    const firstName = d.firstname || d.firstName || d.first_name || '';
    const middleName = d.middlename || d.middleName || d.middle_name || '';
    const lastName = d.surname || d.lastname || d.lastName || d.last_name || '';
    // For BVN, use NameOnCard if available
    const nameOnCard = d.NameOnCard || d.nameoncard || '';
    const name = nameOnCard || [firstName, middleName, lastName].filter(Boolean).join(' ').toUpperCase() || 'N/A';
    
    // Fields to skip in display (shown separately or not needed)
    const skipFields = [
      'photo', 'image', 'signature', 'picture', 'data', 'base64Image',
      'firstname', 'middlename', 'surname', 'lastname', 
      'firstName', 'lastName', 'first_name', 'last_name', 'middle_name', 'middleName',
      'NameOnCard', 'nameoncard',
      'reportID', 'status', 'centralID', 'userid', 'vnin', 'message', 'reference', 'Reference',
      'nok_address1', 'nok_address2', 'nok_firstname', 'nok_middlename', 'nok_surname',
      'nok_state', 'nok_postalcode', 'nok_town', 'nok_lga',
      'pfirstname', 'psurname', 'pmiddlename',
      'self_origin_state', 'self_origin_place', 'self_origin_lga',
      'ospokenlang', 'spoken_language', 'nspokenlang', 'heigth', 'educationallevel',
      'employmentstatus', 'residencestatus', 'title',
      'WatchListed', 'watchlisted', 'Watchlisted'
    ];
    
    // Priority fields to show first (includes both NIN and BVN field names - all lowercase for matching)
    const priorityFieldsLower = [
      'nin', 'bvn', 'trackingid', 'tracking_id', 
      'phonenumber1', 'telephoneno', 'phone', 'phonenumber2',
      'email', 'gender', 
      'dateofbirth', 'birthdate', 'dob',
      'nationality', 
      'stateoforigin', 'state_of_origin',
      'stateofresidence', 'state_of_residence',
      'lgaoforigin', 'lgaofresidence',
      'birthcountry', 'birthstate', 'birthlga', 
      'residence_state', 'residence_lga', 'residence_town', 'residence_address', 
      'maritalstatus', 'religion', 'profession',
      'levelofaccount', 'enrollmentbank', 'enrollmentbranch', 'registrationdate'
    ];
    
    // Filter and sort entries - only show fields with actual values
    const entries = Object.entries(d)
      .filter(([k, v]) => {
        // Skip if in skip list (case insensitive)
        if (skipFields.some(sf => sf.toLowerCase() === k.toLowerCase())) return false;
        // Skip if empty/null/undefined
        if (v === null || v === undefined) return false;
        // Skip if empty string
        if (typeof v === 'string' && v.trim() === '') return false;
        // Skip nested objects
        if (typeof v === 'object') return false;
        return true;
      })
      .sort((a, b) => {
        const aIdx = priorityFieldsLower.indexOf(a[0].toLowerCase());
        const bIdx = priorityFieldsLower.indexOf(b[0].toLowerCase());
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    
    // Format phone number (remove country code for display)
    const formatValue = (key, value) => {
      if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('telephoneno')) {
        const v = String(value);
        if (v.startsWith('234')) return '0' + v.substring(3);
      }
      if (key.toLowerCase() === 'gender') {
        if (value === 'M' || value === 'm') return 'Male';
        if (value === 'F' || value === 'f') return 'Female';
      }
      if (key.toLowerCase() === 'birthcountry') {
        if (value === 'NGA') return 'Nigeria';
      }
      return String(value);
    };
    
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: 20 }}>
        <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } * { color: #000 !important; } }`}</style>
        
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Header */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <button onClick={reset} style={{ width: 42, height: 42, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', fontSize: 18 }}>←</button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Verification Result</h1>
              <p style={{ color: C.textSec, fontSize: 13 }}>Charged: {formatNaira(result.amountCharged)}</p>
            </div>
          </div>
          
          {/* Success Badge */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: C.grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 26 }}>✓</div>
            <p style={{ color: C.success, fontSize: 14, fontWeight: 600 }}>Verification Successful</p>
          </div>
          
          {/* Main Card */}
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
            {/* Photo & Name */}
            <div style={{ background: `linear-gradient(135deg, ${C.primary}15, ${C.secondary}15)`, padding: 24, textAlign: 'center' }}>
              {d.photo && d.photo.length > 50 ? (
                <img
                  src={d.photo.startsWith('data:') ? d.photo : `data:image/jpeg;base64,${d.photo}`}
                  alt="Photo"
                  style={{ width: 130, height: 130, borderRadius: 18, objectFit: 'cover', border: `4px solid ${C.primary}`, boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: 130, height: 130, borderRadius: 18, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: `4px solid ${C.border}`, fontSize: 50, color: C.textMuted }}>👤</div>
              )}
              
              <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginTop: 16 }}>{name}</h2>
              {d.nin && <p style={{ color: C.primary, fontSize: 14, fontWeight: 600, marginTop: 4 }}>NIN: {d.nin}</p>}
              {d.bvn && <p style={{ color: C.primary, fontSize: 14, fontWeight: 600, marginTop: 4 }}>BVN: {d.bvn}</p>}
            </div>
            
            {/* Details */}
            <div style={{ padding: 20 }}>
              <h3 style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📋 Personal Information</h3>
              {entries.length > 0 ? entries.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                  <span style={{ color: C.textMuted, fontSize: 13, minWidth: 120 }}>{formatLabel(k)}</span>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{formatValue(k, v)}</span>
                </div>
              )) : (
                <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center' }}>No additional details available</p>
              )}
            </div>
          </div>
          
          {/* Reference */}
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.textMuted, fontSize: 12 }}>Reference</span>
              <span style={{ color: C.text, fontSize: 12, fontFamily: 'monospace' }}>{result.reference}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ color: C.textMuted, fontSize: 12 }}>New Balance</span>
              <span style={{ color: C.success, fontSize: 14, fontWeight: 700 }}>{formatNaira(result.newBalance)}</span>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="no-print" style={{ display: 'flex', gap: 12 }}>
            <button onClick={printResult} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>🖨️ Print</button>
            <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: C.grad1, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================
  // MAIN FORM
  // ===========================================
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 20 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <button onClick={() => navigate('/dashboard')} style={{ width: 42, height: 42, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', fontSize: 18 }}>←</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Identity Verification</h1>
            <p style={{ color: C.textSec, fontSize: 13 }}>NIN & BVN Lookup</p>
          </div>
        </div>
        
        {/* Balance */}
        <div style={{ background: C.grad1, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Available Balance</p>
          <p style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{formatNaira(user?.balance || 0)}</p>
        </div>
        
        {/* Service Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: C.textMuted, fontSize: 13, marginBottom: 8, display: 'block' }}>Select Service</label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ width: '100%', padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: service ? C.text : C.textMuted, fontSize: 15, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              {service ? (
                <span>{service.name} - <span style={{ color: C.primary }}>{formatNaira(service.price)}</span></span>
              ) : (
                'Choose a service...'
              )}
              <span style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
            </button>
            
            {showDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, marginTop: 4, zIndex: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                {services.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setService(s); setShowDropdown(false); }}
                    style={{ padding: 14, borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', background: service?.id === s.id ? C.primary + '20' : 'transparent' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.text, fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: C.primary, fontWeight: 600 }}>{formatNaira(s.price)}</span>
                    </div>
                    <p style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Input - Different for Demography vs Single Field */}
        {isDemography ? (
          /* Demography Form */
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, display: 'block' }}>First Name</label>
              <input
                type="text"
                value={demoFirstname}
                onChange={e => setDemoFirstname(e.target.value.toUpperCase())}
                placeholder="e.g. VERA"
                style={{ width: '100%', padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontSize: 15, fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, display: 'block' }}>Last Name</label>
              <input
                type="text"
                value={demoLastname}
                onChange={e => setDemoLastname(e.target.value.toUpperCase())}
                placeholder="e.g. CHIBUIKE"
                style={{ width: '100%', padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontSize: 15, fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, display: 'block' }}>Gender</label>
              <select
                value={demoGender}
                onChange={e => setDemoGender(e.target.value)}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: demoGender ? C.text : C.textMuted, fontSize: 15, boxSizing: 'border-box', cursor: 'pointer' }}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, display: 'block' }}>Date of Birth</label>
              <input
                type="date"
                value={demoDob}
                onChange={e => setDemoDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: demoDob ? C.text : C.textMuted, fontSize: 15, boxSizing: 'border-box' }}
              />
            </div>
            <p style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>Enter details exactly as registered on NIN</p>
          </div>
        ) : (
          /* Single Field Input */
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: C.textMuted, fontSize: 13, marginBottom: 8, display: 'block' }}>
              {service?.id?.includes('phone') ? 'Phone Number' : 
               service?.id?.includes('tracking') ? 'Tracking ID' :
               service?.id?.includes('bvn') ? 'BVN' : 'NIN'}
            </label>
            <input
              type={service?.id?.includes('tracking') ? 'text' : 'tel'}
              value={input}
              onChange={e => {
                if (service?.id?.includes('tracking')) {
                  setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20));
                } else if (service?.id?.includes('phone')) {
                  setInput(e.target.value.replace(/\D/g, '').slice(0, 13));
                } else {
                  setInput(e.target.value.replace(/\D/g, '').slice(0, 11));
                }
              }}
              placeholder={getPlaceholder()}
              disabled={!service}
              style={{ width: '100%', padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontSize: 18, fontWeight: 600, letterSpacing: service?.id?.includes('tracking') ? 1 : 2, boxSizing: 'border-box' }}
            />
            {service?.id?.includes('phone') && (
              <p style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>Enter phone in local (080...) or international (234...) format</p>
            )}
            {service?.id?.includes('tracking') && (
              <p style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>Enter the tracking ID from NIN slip (e.g., 7Y0OG2ZO003KUPG)</p>
            )}
          </div>
        )}
        
        {/* Consent */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            style={{ width: 20, height: 20, marginTop: 2, accentColor: C.primary }}
          />
          <span style={{ color: C.textSec, fontSize: 13, lineHeight: 1.4 }}>
            I confirm consent to verify this identity. I understand this is a paid service and my wallet will be charged.
          </span>
        </label>
        
        {/* Error */}
        {error && (
          <div style={{ background: C.error + '20', border: `1px solid ${C.error}`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <p style={{ color: C.error, fontSize: 14 }}>{error}</p>
          </div>
        )}
        
        {/* Insufficient balance warning */}
        {service && service.price > (user?.balance || 0) && (
          <div style={{ background: '#f59e0b20', border: '1px solid #f59e0b', borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <p style={{ color: '#f59e0b', fontSize: 14 }}>Insufficient balance. You need {formatNaira(service.price)} to use this service.</p>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          onClick={verify}
          disabled={!isValid() || loading}
          style={{
            width: '100%', padding: 16, borderRadius: 12, border: 'none',
            background: isValid() ? C.grad1 : C.borderLight,
            color: isValid() ? '#fff' : C.textMuted,
            fontSize: 16, fontWeight: 600, cursor: isValid() ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Verifying...' : `Verify & Pay ${service ? formatNaira(service.price) : ''}`}
        </button>
      </div>
    </div>
  );
}
