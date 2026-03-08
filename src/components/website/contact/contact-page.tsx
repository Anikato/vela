import { Mail, MapPin, Phone } from 'lucide-react';

import { Breadcrumb } from '@/components/website/layout/breadcrumb';

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
  infoTitle: string;
  emailInfo: string;
  phoneInfo: string;
  addressInfo: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

interface ContactPageProps {
  homeHref: string;
  uiLabels: ContactPageUiLabels;
  contactInfo: ContactInfo;
}

export function ContactPage({ homeHref, uiLabels, contactInfo }: ContactPageProps) {
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
          {uiLabels.subtitle ? (
            <p className="mt-2 text-muted-foreground">{uiLabels.subtitle}</p>
          ) : null}
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Contact form */}
          <div className="md:col-span-3">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-5 rounded-xl border border-border bg-card p-6"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {uiLabels.nameLabel} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={uiLabels.namePlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {uiLabels.emailLabel} <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder={uiLabels.emailPlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {uiLabels.messageLabel} <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder={uiLabels.messagePlaceholder}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                disabled
                className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground opacity-60"
                title="Coming soon — inquiry system (P6)"
              >
                {uiLabels.submitButton}
              </button>
            </form>
          </div>

          {/* Contact info sidebar */}
          <div className="md:col-span-2">
            <div className="space-y-6 rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">{uiLabels.infoTitle}</h2>

              {contactInfo.email ? (
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
              ) : null}

              {contactInfo.phone ? (
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
              ) : null}

              {contactInfo.address ? (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{uiLabels.addressInfo}</p>
                    <p className="text-sm text-muted-foreground">{contactInfo.address}</p>
                  </div>
                </div>
              ) : null}

              {!contactInfo.email && !contactInfo.phone && !contactInfo.address ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
