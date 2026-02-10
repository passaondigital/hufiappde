
-- Direct messages between connected users
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to connections"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM user_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND receiver_id = direct_messages.receiver_id)
      OR (receiver_id = auth.uid() AND requester_id = direct_messages.receiver_id)
    )
  )
);

CREATE POLICY "Users can update own received messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- App features for announcements
CREATE TABLE public.app_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active features"
ON public.app_features FOR SELECT
USING (true);

CREATE POLICY "Admins can manage features"
ON public.app_features FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial features
INSERT INTO public.app_features (title, description, icon, badge, sort_order) VALUES
('Pferdeprofil', 'Alle wichtigen Daten deines Pferdes an einem Ort – von Gesundheitsnotizen bis zur kompletten Historie.', 'Heart', NULL, 1),
('KI-Assistent', 'Fragen beantworten, Notizen zusammenfassen, Erinnerungen vorschlagen – dein digitaler Stallhelfer.', 'MessageCircle', NULL, 2),
('Terminverwaltung', 'Hufbearbeitung, Tierarzt, Osteopath – alle Termine übersichtlich und mit Erinnerungen.', 'Calendar', NULL, 3),
('Sprachnotizen', 'Im Stall einfach sprechen statt tippen. Automatische Transkription und Zuordnung zum Pferd.', 'Mic', NULL, 4),
('HuufiConnect', 'Verbinde dich mit anderen Nutzern, teile Pferdeprofile und chatte in Echtzeit.', 'Link2', 'Neu', 5),
('Live-Wetter', 'Aktuelles Wetter an deinem Standort – perfekt für die Stallplanung.', 'CloudSun', 'Neu', 6),
('Tresor', 'Sichere Dokumentenablage mit Passwort- und Fingerabdruck-Schutz.', 'FolderLock', NULL, 7),
('QR-Scanner', 'Scanne QR-Codes direkt mit der Kamera, um dich mit anderen Nutzern zu verbinden.', 'QrCode', 'Neu', 8);
