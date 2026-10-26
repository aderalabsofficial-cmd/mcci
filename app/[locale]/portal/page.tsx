import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { HomeNext } from '@/components/membership/home-next';
import { both, Card, Ic, Journey, L, Tile } from '@/components/membership/ui';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadMyApplication, loadMyMembership, loadPublicSettings } from '@/lib/membership/load';
import { noteText } from '@/lib/membership/notes';
import { msg, screenLink } from '@/lib/nav/model';
import { getSession } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.dashboard') };
}

const TileLink = ({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className: string;
  style: React.CSSProperties;
  children: ReactNode;
}) => (
  <Link href={href} className={className} style={style} data-action="nav">
    {children}
  </Link>
);

/** Member home (prototype member/dashboard): greeting, the one next step, journey, big tiles, latest messages. */
export default async function PortalHomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [session, app, settings, member] = await Promise.all([getSession(), loadMyApplication(), loadPublicSettings(), loadMyMembership()]);
  const first = (session?.access.full_name ?? '').trim().split(/\s+/)[0] || '';
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from('notifications')
    .select('id, title, body, template, vars, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(4);
  const tel = settings.chamber.tel.split(',')[0]!.replace(/[^\d]/g, '');
  const asMember = member && (!app || ['withdrawn', 'draft', 'rejected', 'permanent'].includes(app.stage));
  const sub = asMember
    ? `${member.member_no} · ${msg(locale, `membership.classes.${member.class}`)}`
    : app && app.stage !== 'withdrawn'
      ? msg(locale, 'membership.home.applicant', { token: app.token })
      : msg(locale, 'membership.home.newApplicant');
  const tile = (key: string, icon: string, color: string, label: string, subText?: string) => {
    const link = screenLink('portal', key, locale);
    return (
      <Tile
        key={key}
        icon={icon}
        color={color}
        label={both(label)}
        sub={subText}
        href={link.href}
        reason={link.reason}
        Link={TileLink}
      />
    );
  };
  const notifications = screenLink('portal', 'notifications', locale);
  const requests = screenLink('portal', 'applications', locale);

  return (
    <>
      <div className="hello">
        <div>
          <h1>
            <L
              en={msg('en', 'membership.home.hello', { name: first })}
              ur={msg('ur', 'membership.home.hello', { name: first })}
            />
          </h1>
          <p>
            {(asMember ? member.company : app?.form.name) || msg(locale, 'membership.home.welcome')} · {sub}
          </p>
        </div>
        <a className="btn" href={`tel:+${tel}`} data-action="help.call">
          <Ic name="phone" color="#1b4f9c" /> <L {...both('membership.home.callHelpdesk')} />
        </a>
      </div>

      <HomeNext app={app} locale={locale} member={member} />

      {!asMember && app && app.stage !== 'draft' && app.stage !== 'withdrawn' && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>
              <L {...both('membership.home.journey')} />
            </h3>
            <Link href="/portal/mtrack" data-action="nav">
              {msg(locale, 'membership.home.details')}
            </Link>
          </div>
          <Journey stage={app.stage} />
        </div>
      )}

      <h3 className="sect">
        <L {...both('membership.home.whatToDo')} />
      </h3>
      <div className="btg">
        {tile('membership', 'award', '#c8963e', 'membership.home.tiles.membership', sub)}
        {tile(
          'apply',
          'filePlus',
          '#14b8a6',
          'membership.home.tiles.service',
          msg(locale, 'membership.home.tiles.serviceSub'),
        )}
        {tile(
          'documents',
          'folder',
          '#f59e0b',
          'membership.home.tiles.documents',
          msg(locale, 'membership.home.tiles.documentsSub'),
        )}
        {tile('payments', 'card', '#1fa34a', 'membership.home.tiles.pay', msg(locale, 'membership.home.tiles.paySub'))}
        {tile('support', 'help', '#3b82f6', 'membership.home.tiles.help', msg(locale, 'membership.home.tiles.helpSub'))}
        {tile(
          'events',
          'calendar',
          '#ec4899',
          'membership.home.tiles.events',
          msg(locale, 'membership.home.tiles.eventsSub'),
        )}
      </div>

      <div className="gr" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <Card
          title={<L {...both('membership.home.latest')} />}
          right={
            notifications.href ? (
              <Link href={notifications.href} data-action="nav">
                {msg(locale, 'membership.home.viewAll')}
              </Link>
            ) : null
          }
        >
          {notes?.length ? (
            notes.map((n) => (
              <div className="li st" key={n.id}>
                <i style={{ background: '#1b4f9c22', color: '#1b4f9c' }}>
                  <Ic name={n.read_at ? 'file' : 'flag'} size={20} />
                </i>
                <div>
                  <b>{noteText(locale, n).title}</b>
                  <small>{noteText(locale, n).body}</small>
                </div>
                <span>
                  {new Date(n.created_at).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
                    timeZone: 'Asia/Karachi',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">{msg(locale, 'membership.home.nothing')}</p>
          )}
        </Card>
        <Card
          title={<L {...both('membership.home.requests')} />}
          right={
            requests.href ? (
              <Link href={requests.href} data-action="nav">
                {msg(locale, 'membership.home.viewAll')}
              </Link>
            ) : null
          }
        >
          <p className="muted">{msg(locale, 'membership.home.nothing')}</p>
        </Card>
      </div>
    </>
  );
}
