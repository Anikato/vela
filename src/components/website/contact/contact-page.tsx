import { Mail, MapPin, Phone } from 'lucide-react';

import { Breadcrumb } from '@/components/website/layout/breadcrumb';
import { ContactForm } from './contact-form';

export interface ContactPageUiLabels {
  home: string;
  contact: string;
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitButton: string;
  successMessage: string;
  errorMessage: string;
  infoTitle: string;
  emailInfo: string;
  phoneInfo: string;
  addressInfo: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  whatsapp?: string;
  googleMapsEmbedUrl?: string;
}

interface ContactPageProps {
  homeHref: string;
  captchaSiteKey: string | null;
  uiLabels: ContactPageUiLabels;
  contactInfo: ContactInfo;
}

export function ContactPage({ homeHref, captchaSiteKey, uiLabels, contactInfo }: ContactPageProps) {
  const crumbs = [
    { label: uiLabels.home, href: homeHref },
    { label: uiLabels.contact },
  ];

  return (
    <div>
      <Breadcrumb items={crumbs} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{uiLabels.title}</h1>
          {uiLabels.subtitle && (
            <p className="mt-2 text-muted-foreground">{uiLabels.subtitle}</p>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <ContactForm
              captchaSiteKey={captchaSiteKey}
              labels={{
                nameLabel: uiLabels.nameLabel,
                namePlaceholder: uiLabels.namePlaceholder,
                emailLabel: uiLabels.emailLabel,
                emailPlaceholder: uiLabels.emailPlaceholder,
                messageLabel: uiLabels.messageLabel,
                messagePlaceholder: uiLabels.messagePlaceholder,
                submitButton: uiLabels.submitButton,
                successMessage: uiLabels.successMessage,
                errorMessage: uiLabels.errorMessage,
              }}
            />
          </div>

          <div className="space-y-6 md:col-span-2">
            <div className="space-y-6 rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">{uiLabels.infoTitle}</h2>

              {contactInfo.email && (
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{uiLabels.emailInfo}</p>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.phone && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{uiLabels.phoneInfo}</p>
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.address && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{uiLabels.addressInfo}</p>
                    <p className="text-sm text-muted-foreground">{contactInfo.address}</p>
                  </div>
                </div>
              )}

              {contactInfo.whatsapp && (
                <div className="flex gap-3">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-primary">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <a
                      href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {contactInfo.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {!contactInfo.email && !contactInfo.phone && !contactInfo.address && (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            {/* Google Maps embed */}
            {contactInfo.googleMapsEmbedUrl && (
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  src={contactInfo.googleMapsEmbedUrl}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
