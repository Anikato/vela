import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';

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
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
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
