insert into public.posts (title, body, lat, lng, place_name, group_key, image_path, music, status, created_at)
values

-- 1. Intramuros, Manila
('Bakit ang tahimik dito', 'Parang ang layo ng mundo kahit nasa gitna ka ng Manila. Yung feeling na time-travel ka pag naglakad ka sa loob ng walls. Ang daming history pero walang nakakaalam.', 14.5896, 120.9747, 'Intramuros, Manila', '14.5896,120.9747', null, null, 'approved', now() - interval '3 days'),

-- 2. UP Diliman Sunken Garden
('May exam bukas pero nandito ako', 'Higa sa grass, nakatitig sa langit. Iniisip kung worth it ba talaga ''tong course na ''to. Baka pwede namang maging cloud na lang.', 14.6544, 121.0688, 'Sunken Garden, UP Diliman', '14.6544,121.0688', null, '{"title":"Ere","artist":"Juan Karlos","provider":"deezer","providerId":"1843215","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '5 days'),

-- 3. Maginhawa Street, QC
('Sobrang daming choices dito pero di ko alam gusto ko', null, 14.6407, 121.0480, 'Maginhawa Street, Quezon City', '14.6407,121.0480', null, null, 'approved', now() - interval '1 day'),

-- 4. Luneta Park
('Yung taho vendor dito consistent pa sa ex ko', 'Every morning, same time, same route. Sana all ganon ka-committed sa buhay.', 14.5833, 120.9794, 'Luneta Park, Manila', '14.5833,120.9794', null, null, 'approved', now() - interval '7 days'),

-- 5. SM North EDSA
('Na-realize ko na gastos lang talaga coping mechanism ko', 'Window shopping lang daw. Pero bakit may dala na akong dalawang paper bag? Sabi ko magtitipid this month. Kailan ba matututo?', 14.6572, 121.0311, 'SM North EDSA, Quezon City', '14.6572,121.0311', null, '{"title":"Pera","artist":"December Avenue","provider":"deezer","providerId":"77844372","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '2 days'),

-- 6. Baguio Session Road
('Malamig yung weather, mainit yung kape', 'Perfect combo. Walang phone, walang deadlines for 5 minutes. Sana laging ganito.', 16.4116, 120.5960, 'Session Road, Baguio City', '16.4116,120.5960', null, null, 'approved', now() - interval '10 days'),

-- 7. Quezon Memorial Circle
('Araw-araw ko sinasabi magjojog ako', 'Isang linggo na since last jog ko. Pero at least nag-walk naman ako papuntang 7-Eleven kanina so technically exercise yon.', 14.6517, 121.0497, 'Quezon Memorial Circle', '14.6517,121.0497', null, null, 'approved', now() - interval '4 days'),

-- 8. BGC High Street
('Robot na ata ako', 'Wake up, commute, sit, type, eat, type, commute, sleep. Repeat. Kailan ko huling na-feel na alive talaga? Yung totoo ah.', 14.5503, 121.0490, 'High Street, BGC, Taguig', '14.5503,121.0490', null, '{"title":"Burnout","artist":"3D","provider":"deezer","providerId":"55912377","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '6 hours'),

-- 9. Rizal Park
('Lahat ng tao dito may kanya-kanyang mundo', null, 14.5831, 120.9778, 'Rizal Park, Ermita, Manila', '14.5831,120.9778', null, null, 'approved', now() - interval '12 days'),

-- 10. Cubao Expo
('Yung luma, hindi ibig sabihin wala nang kwenta', 'Ang daming vintage stuff dito na parang time capsule. Minsan mas may value pa yung mga nalimutan kaysa sa bago.', 14.6195, 121.0544, 'Cubao Expo, Quezon City', '14.6195,121.0544', null, '{"title":"Kundiman","artist":"Silent Sanctuary","provider":"deezer","providerId":"444085721","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '8 days'),

-- 11. Vigan, Ilocos Sur
('Kapag gabi mas maganda dito', 'Yung kalesa, yung ilaw, yung cobblestone. Feeling ko naglakad ako sa ibang siglo. Sana naaappreciate ng mga tao yung gantong lugar.', 17.5747, 120.3869, 'Calle Crisologo, Vigan', '17.5747,120.3869', null, null, 'approved', now() - interval '15 days'),

-- 12. Siargao
('Di ako marunong mag-surf pero masaya naman', 'Kinain ako ng alon limang beses pero laughing trip naman. Minsan yung pagsubok na lang ang saya, di yung success.', 9.8482, 126.0458, 'Cloud 9, Siargao', '9.8482,126.0458', null, null, 'approved', now() - interval '20 days'),

-- 13. Divisoria, Manila
('Grind culture personified yung lugar na to', 'Lahat nagmamadali, lahat may bitbit, lahat may deadline. Pero pag tinignan mo maigi, lahat nagtatrabaho para sa pamilya nila. Respect.', 14.6002, 120.9742, 'Divisoria, Manila', '14.6002,120.9742', null, null, 'approved', now() - interval '2 days'),

-- 14. Marikina River Park
('Every Ondoy anniversary na-aalala ko pa rin', 'Yung tubig umabot sa second floor namin. Ngayon park na siya, maganda na. Pero every umulan ng malakas, anxiety pa rin.', 14.6328, 121.0978, 'Marikina River Park', '14.6328,121.0978', null, '{"title":"Ulan","artist":"Cueshe","provider":"deezer","providerId":"667115002","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '30 days'),

-- 15. Tagaytay
('Kahit anong angle maganda naman talaga', 'Pero bakit pag malungkot ka, mas maganda yung view? Parang nagiging meaningful lahat ng simpleng bagay.', 14.1053, 120.9626, 'Tagaytay View Deck', '14.1053,120.9626', null, null, 'approved', now() - interval '9 days'),

-- 16. Eastwood, QC
('3 AM sa office kasi may deployment', 'Walang tao sa labas except yung aso sa 7-Eleven. Parang kami lang dalawa yung gising sa buong mundo.', 14.6092, 121.0802, 'Eastwood City, Libis', '14.6092,121.0802', null, null, 'approved', now() - interval '1 day'),

-- 17. Antipolo
('Nandito na naman ako ulit mag-isa', 'Hindi naman malungkot. Minsan kailangan lang talaga mag-isa para makapag-isip. Yung city lights pag gabi, parang fireflies na organized.', 14.5862, 121.1761, 'Antipolo Overlooking', '14.5862,121.1761', null, '{"title":"Huwag Ka Nang Umiyak","artist":"Sugarfree","provider":"deezer","providerId":"899321544","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '14 days'),

-- 18. Manila Bay
('Ang dami kong gustong sabihin pero wala akong masabihan', null, 14.5730, 120.9680, 'Manila Bay Boardwalk', '14.5730,120.9680', null, null, 'approved', now() - interval '3 days'),

-- 19. LRT-2 Recto Station
('Nakatulog ako ng tatlong station', 'Gumising akong Santolan na. Late na naman. Pero at least naka-power nap. Bawi na lang sa pagiging alert sa meeting mamaya.', 14.6033, 120.9833, 'LRT-2 Recto Station, Manila', '14.6033,120.9833', null, null, 'approved', now() - interval '18 hours'),

-- 20. Cebu IT Park
('Libre na naman kape sa pantry', 'Pero walang flavor. Parang work na rin—functional pero walang soul. Gusto ko na umuwi. Pero ayoko rin naman sa bahay. Nasaan ba talaga gusto ko?', 10.3270, 123.9057, 'IT Park, Cebu City', '10.3270,123.9057', null, '{"title":"Pahiram","artist":"The Juans","provider":"deezer","providerId":"1129055712","coverUrl":"https://e-cdns-images.dzcdn.net/images/cover/8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d/250x250-000000-80-0-0.jpg"}', 'approved', now() - interval '11 days');
