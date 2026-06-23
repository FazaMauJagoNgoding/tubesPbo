import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  Camera,
  Phone,
  MapPin,
  X,
  Wand2,
  Eye,
  CheckCircle2,
  Mail,
  AlignLeft,
  QrCode,
  Lightbulb,
  Library,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { completeMemberProfile, getSession, isProfileCompleted, MemberProfile } from '@/src/lib/firebaseBackend';

type FormErrors = Partial<Record<keyof MemberProfile | 'photoProfile', string>>;

const defaultAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#e2e8f0"/>
  <circle cx="100" cy="78" r="36" fill="#94a3b8"/>
  <path d="M38 178c8-42 35-66 62-66s54 24 62 66" fill="#94a3b8"/>
</svg>
`)}`;

export default function ProfileCompletionView() {
  const session = getSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState((location.state as { toast?: string } | null)?.toast || '');
  const [isGenerated, setIsGenerated] = useState(isProfileCompleted(session));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoPreview, setPhotoPreview] = useState(defaultAvatar);
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false);
  const [formData, setFormData] = useState<MemberProfile>({
    fullName: session?.name || '',
    username: '',
    email: session?.email || '',
    phone: '',
    location: '',
    bio: '',
  });
  const completedFields = [
    formData.fullName.trim(),
    formData.username.trim(),
    formData.email.trim(),
    formData.phone.trim(),
    formData.location.trim(),
    formData.bio.trim(),
    hasUploadedPhoto,
  ].filter(Boolean).length;
  const profileProgress = Math.round((completedFields / 7) * 100);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isProfileCompleted(session)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setIsGenerated(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photoProfile: 'File harus berupa gambar JPG atau PNG.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photoProfile: 'Ukuran photo profile maksimal 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
        setHasUploadedPhoto(true);
        setIsGenerated(false);
        setErrors((prev) => ({ ...prev, photoProfile: undefined }));
      }
    };
    reader.onerror = () => setErrors((prev) => ({ ...prev, photoProfile: 'Gagal membaca file photo profile.' }));
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = 'Full Name wajib diisi.';
    if (!formData.username.trim()) nextErrors.username = 'NIM wajib diisi.';
    if (!formData.email.trim()) nextErrors.email = 'Email Address wajib diisi.';
    if (!formData.phone.trim()) nextErrors.phone = 'Phone Number wajib diisi.';
    if (!formData.location.trim()) nextErrors.location = 'Kelas / Semester wajib diisi.';
    if (!formData.bio.trim()) nextErrors.bio = 'Short Bio wajib diisi.';
    if (!hasUploadedPhoto) nextErrors.photoProfile = 'Upload Photo wajib diisi.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await completeMemberProfile({
        ...formData,
        photoUrl: photoPreview,
        photoProfile: photoPreview,
        completionProgress: profileProgress,
        profileCompletion: profileProgress === 100,
      }, session);
      setIsGenerated(true);
      navigate('/dashboard', { replace: true });
    } catch (exception) {
      setToast(exception instanceof Error ? exception.message : 'Gagal menyimpan profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (field: keyof MemberProfile) => (
    errors[field] ? <p className="text-xs font-medium text-red-600">{errors[field]}</p> : null
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {toast && (
        <div className="fixed right-6 top-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-blue-100 bg-white p-4 text-sm text-slate-700 shadow-xl">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <p className="font-medium">{toast}</p>
          <button onClick={() => setToast('')} className="ml-auto text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-primary">CampusLib</h1>
              <p className="mt-1 text-[10px] font-medium uppercase leading-none tracking-widest text-on-surface-variant">Digital Management</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-slate-500 hover:text-slate-900">
              <Bell className="h-5 w-5" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            <button className="flex items-center gap-2">
              <img
                src={photoPreview}
                alt="User avatar"
                className="h-8 w-8 rounded-full border border-slate-200 object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <form onSubmit={handleGenerateCard} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-500">Fill in your details to create your digital CampusLib member card.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-[120px_1fr]">
                  <div className="flex flex-col gap-2">
                    <label className="flex h-[120px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100">
                      {photoPreview === defaultAvatar ? (
                        <>
                          <Camera className="mb-2 h-6 w-6 text-blue-600" />
                          <span className="text-xs font-medium text-slate-600">Upload Photo</span>
                        </>
                      ) : (
                        <img src={photoPreview} alt="Uploaded profile" className="h-full w-full object-cover" />
                      )}
                      <input type="file" accept="image/png,image/jpeg" onChange={handlePhotoChange} className="sr-only" />
                    </label>
                    <span className="text-center text-[10px] text-slate-500">JPG, PNG up to 5MB</span>
                    {errors.photoProfile && <p className="text-center text-xs font-medium text-red-600">{errors.photoProfile}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700" htmlFor="fullName">Full Name</label>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {fieldError('fullName')}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700" htmlFor="username">NIM</label>
                      <div className="relative">
                        <input
                          id="username"
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      {fieldError('username')}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {fieldError('email')}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700" htmlFor="phone">Phone Number</label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 h-4 w-4 text-slate-400" />
                      <input
                        id="phone"
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {fieldError('phone')}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700" htmlFor="location">Kelas / Semester</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 h-4 w-4 text-slate-400" />
                      <input
                        id="location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => setFormData((prev) => ({ ...prev, location: '' }))} className="absolute right-3 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {fieldError('location')}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700" htmlFor="bio">Short Bio</label>
                  <div className="relative">
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      maxLength={160}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    ></textarea>
                    <span className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                      {formData.bio.length}/160
                    </span>
                  </div>
                  {fieldError('bio')}
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Lengkapi semua data sebelum membuat member card.
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#152943] disabled:cursor-not-allowed disabled:opacity-70">
                  <Wand2 className="h-4 w-4" />
                  {isSubmitting ? 'Generating...' : 'Generate Member Card'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/50 text-slate-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
                <p className="text-sm text-slate-500">This is how your digital identity card will look.</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-[#e0eafc] via-[#f8fafe] to-white p-8 shadow-sm">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

              <div className="relative z-10 flex flex-col gap-6 sm:flex-row">
                <div className="relative shrink-0">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-sm">
                    <img src={photoPreview} alt="Profile Preview" className="h-full w-full object-cover" />
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1e293b]">{formData.fullName || 'Your Name'}</h3>
                    <p className="text-sm font-medium text-blue-700">{formData.username || 'NIM'}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${isGenerated ? 'bg-[#ccfbf1] text-[#0f766e]' : 'bg-amber-100 text-amber-700'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isGenerated ? 'PROFILE VERIFIED' : 'PROFILE PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8 space-y-4">
                <div className="grid grid-cols-[24px_80px_1fr] items-start gap-1 text-sm text-slate-700">
                  <Mail className="mt-0.5 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-600">Email</span>
                  <span>: {formData.email || '-'}</span>
                </div>
                <div className="grid grid-cols-[24px_80px_1fr] items-start gap-1 text-sm text-slate-700">
                  <Phone className="mt-0.5 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-600">Phone</span>
                  <span>: {formData.phone || '-'}</span>
                </div>
                <div className="grid grid-cols-[24px_80px_1fr] items-start gap-1 text-sm text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-600">Kelas/Smt</span>
                  <span>: {formData.location || '-'}</span>
                </div>
                <div className="grid grid-cols-[24px_80px_1fr] items-start gap-1 text-sm text-slate-700">
                  <AlignLeft className="mt-0.5 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-600">Bio</span>
                  <span className="leading-relaxed">: {formData.bio || '-'}</span>
                </div>
              </div>

              <div className="relative z-10 mt-8 flex items-end justify-between border-t border-dashed border-slate-300 pt-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CampusLib ID</span>
                  <div className="inline-block rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 font-mono text-sm font-medium tracking-widest text-slate-700">
                    PRFL-2024-0001-ABCD
                  </div>
                </div>
                <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-white">
                  <QrCode className="h-6 w-6 text-slate-700" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Profile Completion</h3>
                <span className="font-bold text-[#1e3a5f]">{profileProgress}%</span>
              </div>

              <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#1e3a5f] transition-all duration-300" style={{ width: `${profileProgress}%` }}></div>
              </div>

              <div className="flex items-start gap-3 rounded-lg text-sm text-slate-600">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
                <p className="leading-relaxed">
                  Almost there! Complete a few more fields to finish your student profile and unlock all library features.
                </p>
              </div>

              {isGenerated && (
                <button onClick={() => navigate('/dashboard')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#152943]">
                  Lanjut ke Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {!isGenerated && (
                <p className="mt-5 text-center text-xs font-medium text-slate-500">
                  Dashboard akan aktif setelah member card berhasil dibuat.
                </p>
              )}
            </div>

            <div className="text-center text-xs text-slate-500">
              <Link to="/" className="font-semibold text-[#1e3a5f] hover:underline">Kembali ke landing page</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
