-- ============================================================
-- SUMMER BODY GOAL - Données initiales
-- Recettes régime + Planning 2 semaines
-- Coller dans Supabase SQL Editor puis cliquer Run
-- ============================================================

-- ============================================================
-- 1. RECETTES
-- ============================================================

-- Nettoyage préalable pour relancer sans erreur
DELETE FROM meal_plans;
DELETE FROM recipes;

INSERT INTO recipes (name, description, prep_time_minutes, cook_time_minutes, servings, calories_per_serving, protein_g, carbs_g, fat_g, ingredients, steps, tags) VALUES

-- ===== PETIT-DÉJEUNER =====

('Porridge avoine banane et miel',
'Un porridge crémeux et rassasiant pour bien démarrer la journée.',
5, 10, 1, 370, 12, 64, 7,
'[{"name":"Flocons d''avoine","quantity":80,"unit":"g"},{"name":"Lait demi-écrémé","quantity":250,"unit":"ml"},{"name":"Banane","quantity":1,"unit":"pièce"},{"name":"Miel","quantity":1,"unit":"cs"},{"name":"Amandes effilées","quantity":15,"unit":"g"}]',
'[{"order":1,"description":"Verser les flocons d''avoine et le lait dans une casserole.","duration_minutes":1},{"order":2,"description":"Chauffer à feu moyen en remuant sans arrêt pendant 7-8 minutes jusqu''à épaississement.","duration_minutes":8},{"order":3,"description":"Verser dans un bol. Couper la banane en rondelles et les déposer par-dessus.","duration_minutes":1},{"order":4,"description":"Arroser de miel et parsemer d''amandes effilées. Servir aussitôt."}]',
ARRAY['petit-dejeuner','healthy','rapide']),

('Omelette épinards et champignons',
'Une omelette légère et protéinée, idéale pour démarrer la journée.',
5, 8, 1, 270, 20, 5, 18,
'[{"name":"Oeufs","quantity":3,"unit":"pièces"},{"name":"Champignons de Paris","quantity":100,"unit":"g"},{"name":"Épinards frais","quantity":50,"unit":"g"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Émincer les champignons en lamelles. Rincer les épinards.","duration_minutes":2},{"order":2,"description":"Faire revenir les champignons dans l''huile d''olive à feu vif pendant 3 minutes. Ajouter les épinards et laisser tomber 2 minutes.","duration_minutes":5},{"order":3,"description":"Battre les oeufs avec une pincée de sel. Verser sur les légumes dans la poêle.","duration_minutes":1},{"order":4,"description":"Cuire à feu moyen jusqu''à ce que l''omelette soit prise. Replier et servir chaud.","duration_minutes":3}]',
ARRAY['petit-dejeuner','proteine','low-carb','rapide']),

('Pancakes protéinés avoine',
'Des pancakes moelleux et riches en protéines, sans farine blanche.',
10, 10, 2, 320, 22, 38, 8,
'[{"name":"Flocons d''avoine","quantity":100,"unit":"g"},{"name":"Oeufs","quantity":2,"unit":"pièces"},{"name":"Fromage blanc 0%","quantity":150,"unit":"g"},{"name":"Lait demi-écrémé","quantity":50,"unit":"ml"},{"name":"Levure chimique","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Mixer les flocons d''avoine en farine fine dans un blender.","duration_minutes":1},{"order":2,"description":"Dans un saladier, mélanger la farine d''avoine, les oeufs, le fromage blanc, le lait et la levure. Fouetter jusqu''à obtenir une pâte lisse.","duration_minutes":3},{"order":3,"description":"Faire chauffer une poêle antiadhésive à feu moyen. Verser des petites louches de pâte.","duration_minutes":1},{"order":4,"description":"Cuire 2-3 minutes de chaque côté jusqu''à dorure. Servir avec des fruits frais.","duration_minutes":8}]',
ARRAY['petit-dejeuner','proteine','healthy']),

('Yaourt grec fruits rouges et chia',
'Un petit-déjeuner frais, rapide et naturellement sucré.',
5, 0, 1, 200, 15, 24, 4,
'[{"name":"Yaourt grec nature 0%","quantity":200,"unit":"g"},{"name":"Fruits rouges","quantity":100,"unit":"g"},{"name":"Miel","quantity":1,"unit":"cc"},{"name":"Graines de chia","quantity":10,"unit":"g"}]',
'[{"order":1,"description":"Si les fruits rouges sont surgelés, les décongeler 5 minutes au micro-ondes ou la veille au frigo.","duration_minutes":2},{"order":2,"description":"Verser le yaourt grec dans un bol."},{"order":3,"description":"Déposer les fruits rouges par-dessus, arroser de miel et saupoudrer de graines de chia."}]',
ARRAY['petit-dejeuner','rapide','healthy','sans cuisson']),

-- ===== DÉJEUNER =====

('Salade poulet grillé et avocat',
'Une salade complète, colorée et rassasiante pour tenir toute la journée.',
15, 14, 2, 440, 38, 12, 26,
'[{"name":"Blanc de poulet","quantity":300,"unit":"g"},{"name":"Salade verte","quantity":100,"unit":"g"},{"name":"Avocat","quantity":1,"unit":"pièce"},{"name":"Tomates cerises","quantity":150,"unit":"g"},{"name":"Concombre","quantity":0.5,"unit":"pièce"},{"name":"Jus de citron","quantity":2,"unit":"cs"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Assaisonner les blancs de poulet avec les herbes de Provence, sel et un filet d''huile. Cuire à la poêle 7 minutes de chaque côté.","duration_minutes":14},{"order":2,"description":"Pendant ce temps, couper les tomates cerises en deux, le concombre en dés et l''avocat en tranches.","duration_minutes":5},{"order":3,"description":"Laisser reposer le poulet 2 minutes puis le couper en lamelles.","duration_minutes":2},{"order":4,"description":"Dresser la salade verte dans un saladier. Ajouter les légumes, les tranches d''avocat et le poulet."},{"order":5,"description":"Arroser de jus de citron et du reste d''huile d''olive. Servir immédiatement."}]',
ARRAY['dejeuner','proteine','healthy','sans gluten']),

('Bowl quinoa dinde et légumes rôtis',
'Un bowl complet avec des protéines maigres et des légumes savoureux.',
10, 25, 2, 480, 40, 45, 12,
'[{"name":"Quinoa","quantity":150,"unit":"g"},{"name":"Escalope de dinde","quantity":300,"unit":"g"},{"name":"Courgette","quantity":1,"unit":"pièce"},{"name":"Carottes","quantity":2,"unit":"pièces"},{"name":"Huile d''olive","quantity":2,"unit":"cs"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"},{"name":"Ail en poudre","quantity":0.5,"unit":"cc"}]',
'[{"order":1,"description":"Préchauffer le four à 200°C.","duration_minutes":1},{"order":2,"description":"Couper les courgettes et carottes en dés. Disposer sur une plaque, arroser d''huile d''olive, saupoudrer d''herbes et d''ail. Mélanger et enfourner 20 minutes.","duration_minutes":22},{"order":3,"description":"Rincer le quinoa. Le cuire dans 300ml d''eau salée à feu doux pendant 12 minutes. Couvrir et laisser gonfler 3 minutes hors du feu.","duration_minutes":15},{"order":4,"description":"Couper la dinde en dés, assaisonner et cuire à la poêle avec un filet d''huile pendant 8 minutes.","duration_minutes":8},{"order":5,"description":"Assembler les bols : quinoa en base, dinde et légumes rôtis par-dessus."}]',
ARRAY['dejeuner','proteine','healthy']),

('Salade niçoise légère',
'Un grand classique allégé, protéiné et plein de saveurs.',
15, 10, 2, 380, 30, 22, 18,
'[{"name":"Thon au naturel","quantity":200,"unit":"g"},{"name":"Oeufs","quantity":3,"unit":"pièces"},{"name":"Haricots verts","quantity":200,"unit":"g"},{"name":"Tomates","quantity":3,"unit":"pièces"},{"name":"Salade verte","quantity":80,"unit":"g"},{"name":"Olives noires","quantity":30,"unit":"g"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Vinaigre de vin","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Faire cuire les oeufs durs 10 minutes dans l''eau bouillante. Les passer sous l''eau froide, les écaler et les couper en quartiers.","duration_minutes":12},{"order":2,"description":"Cuire les haricots verts à la vapeur ou à l''eau salée pendant 8 minutes. Égoutter et laisser refroidir.","duration_minutes":8},{"order":3,"description":"Couper les tomates en quartiers.","duration_minutes":2},{"order":4,"description":"Dresser la salade verte, les haricots, les tomates, le thon émietté, les oeufs et les olives dans un grand saladier."},{"order":5,"description":"Mélanger l''huile d''olive et le vinaigre pour la vinaigrette. Assaisonner et verser sur la salade au moment de servir."}]',
ARRAY['dejeuner','proteine','classique','sans gluten']),

('Soupe de lentilles corail et carottes',
'Une soupe veloutée, nourrissante et réconfortante. Se prépare à l''avance.',
10, 25, 4, 280, 18, 42, 4,
'[{"name":"Lentilles corail","quantity":200,"unit":"g"},{"name":"Carottes","quantity":3,"unit":"pièces"},{"name":"Oignon","quantity":1,"unit":"pièce"},{"name":"Bouillon de légumes","quantity":1,"unit":"litre"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Cumin en poudre","quantity":0.5,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Éplucher et couper les carottes en rondelles. Émincer l''oignon.","duration_minutes":5},{"order":2,"description":"Faire revenir l''oignon dans l''huile d''olive 3 minutes à feu moyen jusqu''à transparence.","duration_minutes":3},{"order":3,"description":"Ajouter les carottes, les lentilles corail rincées, le cumin et le bouillon. Porter à ébullition.","duration_minutes":3},{"order":4,"description":"Baisser le feu et laisser mijoter 20 minutes jusqu''à ce que les lentilles soient fondantes.","duration_minutes":20},{"order":5,"description":"Mixer avec un mixeur plongeant jusqu''à obtenir une texture veloutée. Rectifier le sel.","duration_minutes":2}]',
ARRAY['dejeuner','vegetarien','batch-cooking']),

('Wrap dinde et crudités',
'Un wrap léger, rapide et protéiné pour la pause déjeuner.',
10, 6, 1, 350, 30, 34, 8,
'[{"name":"Tortilla de blé complet","quantity":1,"unit":"pièce"},{"name":"Escalope de dinde","quantity":120,"unit":"g"},{"name":"Salade verte","quantity":30,"unit":"g"},{"name":"Tomate","quantity":1,"unit":"pièce"},{"name":"Concombre","quantity":0.25,"unit":"pièce"},{"name":"Fromage blanc 0%","quantity":30,"unit":"g"},{"name":"Jus de citron","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Cuire l''escalope de dinde à la poêle 3 minutes de chaque côté à feu moyen. Laisser reposer et couper en lanières.","duration_minutes":7},{"order":2,"description":"Couper la tomate et le concombre en fines rondelles.","duration_minutes":2},{"order":3,"description":"Étaler le fromage blanc sur toute la surface de la tortilla."},{"order":4,"description":"Déposer la salade, les légumes en rondelles et les lanières de dinde."},{"order":5,"description":"Arroser d''un filet de jus de citron. Rouler le wrap bien serré et couper en deux en diagonale."}]',
ARRAY['dejeuner','rapide','proteine']),

-- ===== DÎNER =====

('Poulet rôti riz basmati et haricots verts',
'Le dîner équilibré par excellence, simple et toujours bon.',
10, 25, 2, 510, 44, 52, 10,
'[{"name":"Blanc de poulet","quantity":300,"unit":"g"},{"name":"Riz basmati","quantity":150,"unit":"g"},{"name":"Haricots verts","quantity":250,"unit":"g"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"},{"name":"Ail en poudre","quantity":0.5,"unit":"cc"}]',
'[{"order":1,"description":"Rincer le riz basmati. Le verser dans une casserole avec 300ml d''eau salée. Porter à ébullition, baisser le feu, couvrir et cuire 12 minutes. Laisser gonfler 3 minutes hors du feu.","duration_minutes":16},{"order":2,"description":"Cuire les haricots verts à la vapeur 8 minutes. Ils doivent rester légèrement croquants.","duration_minutes":8},{"order":3,"description":"Badigeonner le poulet d''huile d''olive, d''herbes de Provence et d''ail en poudre.","duration_minutes":2},{"order":4,"description":"Cuire le poulet à la poêle à feu moyen, 7 minutes de chaque côté. Laisser reposer 2 minutes avant de trancher.","duration_minutes":16},{"order":5,"description":"Dresser l''assiette : riz, haricots verts et poulet tranché. Assaisonner selon le goût."}]',
ARRAY['diner','proteine','healthy','equilibre']),

('Saumon four brocolis et patate douce',
'Un dîner riche en oméga-3 et en fibres, aussi bon que nutritif.',
10, 25, 2, 550, 38, 36, 22,
'[{"name":"Filet de saumon","quantity":300,"unit":"g"},{"name":"Patate douce","quantity":300,"unit":"g"},{"name":"Brocoli","quantity":300,"unit":"g"},{"name":"Huile d''olive","quantity":2,"unit":"cs"},{"name":"Jus de citron","quantity":2,"unit":"cs"},{"name":"Aneth séché","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Préchauffer le four à 200°C.","duration_minutes":1},{"order":2,"description":"Éplucher la patate douce, la couper en cubes de 2cm. Disposer sur une plaque, arroser d''une cuillère d''huile, saler. Enfourner 15 minutes.","duration_minutes":16},{"order":3,"description":"Couper le brocoli en fleurettes. Ajouter sur la plaque et continuer la cuisson 10 minutes.","duration_minutes":10},{"order":4,"description":"Déposer le saumon dans un plat allant au four. Arroser de jus de citron et du reste d''huile. Saupoudrer d''aneth. Enfourner 15 minutes en même temps que les légumes.","duration_minutes":15},{"order":5,"description":"Servir le saumon avec les légumes rôtis. Ajouter un filet de citron si souhaité."}]',
ARRAY['diner','omega3','healthy','sans gluten']),

('Escalope de dinde champignons et courgettes',
'Un plat léger et savoureux avec une sauce crémeuse légère.',
10, 20, 2, 360, 42, 12, 14,
'[{"name":"Escalope de dinde","quantity":320,"unit":"g"},{"name":"Champignons de Paris","quantity":200,"unit":"g"},{"name":"Courgette","quantity":2,"unit":"pièces"},{"name":"Oignon","quantity":1,"unit":"pièce"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Crème légère 5%","quantity":50,"unit":"ml"},{"name":"Persil frais","quantity":1,"unit":"bouquet"}]',
'[{"order":1,"description":"Émincer l''oignon, couper les champignons en lamelles et les courgettes en demi-rondelles.","duration_minutes":5},{"order":2,"description":"Faire revenir l''oignon dans l''huile d''olive 2 minutes. Ajouter les champignons, cuire 5 minutes à feu vif jusqu''à évaporation de l''eau.","duration_minutes":7},{"order":3,"description":"Ajouter les courgettes et cuire encore 5 minutes à feu moyen.","duration_minutes":5},{"order":4,"description":"Dans une autre poêle, cuire les escalopes de dinde 5 minutes de chaque côté. Couper en lanières.","duration_minutes":10},{"order":5,"description":"Ajouter la crème légère aux légumes, laisser réduire 2 minutes. Dresser les escalopes nappées de sauce. Parsemer de persil haché.","duration_minutes":2}]',
ARRAY['diner','proteine','low-carb']),

('Cabillaud vapeur carottes et haricots verts',
'Un dîner très léger et digeste, parfait en période de régime.',
10, 20, 2, 300, 36, 22, 6,
'[{"name":"Filet de cabillaud","quantity":350,"unit":"g"},{"name":"Carottes","quantity":3,"unit":"pièces"},{"name":"Haricots verts","quantity":200,"unit":"g"},{"name":"Jus de citron","quantity":2,"unit":"cs"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Persil frais","quantity":1,"unit":"bouquet"}]',
'[{"order":1,"description":"Éplucher les carottes et les couper en bâtonnets. Équêter les haricots verts.","duration_minutes":5},{"order":2,"description":"Mettre les carottes et haricots verts dans le panier vapeur. Cuire 15 minutes à la vapeur.","duration_minutes":15},{"order":3,"description":"Ajouter les filets de cabillaud dans le panier vapeur au-dessus des légumes. Cuire encore 10 minutes.","duration_minutes":10},{"order":4,"description":"Préparer la sauce : mélanger le jus de citron, l''huile d''olive et le persil finement haché.","duration_minutes":2},{"order":5,"description":"Dresser les légumes et le cabillaud dans l''assiette. Napper de sauce citronnée."}]',
ARRAY['diner','light','sans gluten','omega3']),

('Steak boeuf quinoa et courgettes sautées',
'Un dîner musclé pour les jours d''entraînement, riche en protéines.',
10, 20, 2, 540, 46, 38, 18,
'[{"name":"Steak de boeuf haché 5%","quantity":300,"unit":"g"},{"name":"Quinoa","quantity":150,"unit":"g"},{"name":"Courgette","quantity":2,"unit":"pièces"},{"name":"Ail","quantity":1,"unit":"gousse"},{"name":"Huile d''olive","quantity":1,"unit":"cs"},{"name":"Persil frais","quantity":1,"unit":"bouquet"}]',
'[{"order":1,"description":"Rincer le quinoa. Le cuire dans 300ml d''eau salée à feu doux pendant 12 minutes. Couvrir et laisser gonfler 3 minutes.","duration_minutes":16},{"order":2,"description":"Couper les courgettes en demi-rondelles. Émincer l''ail.","duration_minutes":3},{"order":3,"description":"Faire sauter les courgettes et l''ail dans l''huile d''olive à feu vif pendant 7 minutes. Saler.","duration_minutes":7},{"order":4,"description":"Cuire le steak à la poêle très chaude 3 minutes de chaque côté. Laisser reposer 2 minutes avant de servir.","duration_minutes":8},{"order":5,"description":"Dresser l''assiette : quinoa, courgettes sautées et steak. Parsemer de persil haché."}]',
ARRAY['diner','proteine','sans gluten','sport']),

('Gratin de courgettes au fromage blanc',
'Un gratin léger et réconfortant sans matière grasse ajoutée.',
10, 30, 2, 280, 20, 18, 10,
'[{"name":"Courgette","quantity":4,"unit":"pièces"},{"name":"Fromage blanc 0%","quantity":200,"unit":"g"},{"name":"Oeufs","quantity":2,"unit":"pièces"},{"name":"Gruyère râpé","quantity":40,"unit":"g"},{"name":"Ail","quantity":1,"unit":"gousse"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Préchauffer le four à 180°C.","duration_minutes":1},{"order":2,"description":"Couper les courgettes en rondelles fines. Les faire revenir à la poêle sans matière grasse 5 minutes pour enlever l''excès d''eau. Saler.","duration_minutes":5},{"order":3,"description":"Dans un saladier, mélanger le fromage blanc, les oeufs battus, l''ail pressé et les herbes.","duration_minutes":3},{"order":4,"description":"Verser les courgettes dans un plat à gratin. Napper de la préparation au fromage blanc. Saupoudrer de gruyère râpé.","duration_minutes":2},{"order":5,"description":"Enfourner 25-30 minutes jusqu''à ce que le dessus soit doré. Laisser tiédir avant de servir.","duration_minutes":28}]',
ARRAY['diner','light','vegetarien']),

-- ===== COLLATION =====

('Fromage blanc fruits rouges et graines de chia',
'Une collation protéinée et anti-oxydante, prête en 2 minutes.',
2, 0, 1, 180, 14, 22, 4,
'[{"name":"Fromage blanc 0%","quantity":200,"unit":"g"},{"name":"Fruits rouges","quantity":100,"unit":"g"},{"name":"Graines de chia","quantity":10,"unit":"g"},{"name":"Miel","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Verser le fromage blanc dans un bol."},{"order":2,"description":"Déposer les fruits rouges par-dessus."},{"order":3,"description":"Saupoudrer de graines de chia et arroser d''un filet de miel."}]',
ARRAY['collation','rapide','proteine','sans cuisson']),

('Oeufs durs et avocat',
'Une collation naturelle et rassasiante, riche en bons lipides.',
2, 10, 1, 250, 12, 6, 20,
'[{"name":"Oeufs","quantity":2,"unit":"pièces"},{"name":"Avocat","quantity":0.5,"unit":"pièce"},{"name":"Jus de citron","quantity":1,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Faire cuire les oeufs dans l''eau bouillante pendant 10 minutes. Passer sous l''eau froide et écaler.","duration_minutes":12},{"order":2,"description":"Couper l''avocat en tranches et arroser de jus de citron pour éviter l''oxydation."},{"order":3,"description":"Couper les oeufs en deux, saler légèrement. Servir avec les tranches d''avocat."}]',
ARRAY['collation','proteine','sans gluten','rapide']);


-- ============================================================
-- 2. PLANNING SEMAINE EN COURS (21 Avril 2026)
-- ============================================================

INSERT INTO meal_plans (week_start_date, day, meal_type, recipe_id) VALUES

-- Lundi
('2026-04-21','Lundi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Porridge avoine banane et miel' LIMIT 1)),
('2026-04-21','Lundi','dejeuner',(SELECT id FROM recipes WHERE name='Salade niçoise légère' LIMIT 1)),
('2026-04-21','Lundi','diner',(SELECT id FROM recipes WHERE name='Poulet rôti riz basmati et haricots verts' LIMIT 1)),
('2026-04-21','Lundi','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1)),

-- Mardi
('2026-04-21','Mardi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Omelette épinards et champignons' LIMIT 1)),
('2026-04-21','Mardi','dejeuner',(SELECT id FROM recipes WHERE name='Bowl quinoa dinde et légumes rôtis' LIMIT 1)),
('2026-04-21','Mardi','diner',(SELECT id FROM recipes WHERE name='Saumon four brocolis et patate douce' LIMIT 1)),
('2026-04-21','Mardi','collation',(SELECT id FROM recipes WHERE name='Oeufs durs et avocat' LIMIT 1)),

-- Mercredi
('2026-04-21','Mercredi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Pancakes protéinés avoine' LIMIT 1)),
('2026-04-21','Mercredi','dejeuner',(SELECT id FROM recipes WHERE name='Wrap dinde et crudités' LIMIT 1)),
('2026-04-21','Mercredi','diner',(SELECT id FROM recipes WHERE name='Escalope de dinde champignons et courgettes' LIMIT 1)),
('2026-04-21','Mercredi','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1)),

-- Jeudi
('2026-04-21','Jeudi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Yaourt grec fruits rouges et chia' LIMIT 1)),
('2026-04-21','Jeudi','dejeuner',(SELECT id FROM recipes WHERE name='Salade poulet grillé et avocat' LIMIT 1)),
('2026-04-21','Jeudi','diner',(SELECT id FROM recipes WHERE name='Cabillaud vapeur carottes et haricots verts' LIMIT 1)),
('2026-04-21','Jeudi','collation',(SELECT id FROM recipes WHERE name='Oeufs durs et avocat' LIMIT 1)),

-- Vendredi
('2026-04-21','Vendredi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Porridge avoine banane et miel' LIMIT 1)),
('2026-04-21','Vendredi','dejeuner',(SELECT id FROM recipes WHERE name='Soupe de lentilles corail et carottes' LIMIT 1)),
('2026-04-21','Vendredi','diner',(SELECT id FROM recipes WHERE name='Steak boeuf quinoa et courgettes sautées' LIMIT 1)),
('2026-04-21','Vendredi','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1)),

-- Samedi
('2026-04-21','Samedi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Omelette épinards et champignons' LIMIT 1)),
('2026-04-21','Samedi','dejeuner',(SELECT id FROM recipes WHERE name='Salade poulet grillé et avocat' LIMIT 1)),
('2026-04-21','Samedi','diner',(SELECT id FROM recipes WHERE name='Gratin de courgettes au fromage blanc' LIMIT 1)),
('2026-04-21','Samedi','collation',(SELECT id FROM recipes WHERE name='Oeufs durs et avocat' LIMIT 1)),

-- Dimanche
('2026-04-21','Dimanche','petit_dejeuner',(SELECT id FROM recipes WHERE name='Pancakes protéinés avoine' LIMIT 1)),
('2026-04-21','Dimanche','dejeuner',(SELECT id FROM recipes WHERE name='Bowl quinoa dinde et légumes rôtis' LIMIT 1)),
('2026-04-21','Dimanche','diner',(SELECT id FROM recipes WHERE name='Poulet rôti riz basmati et haricots verts' LIMIT 1)),
('2026-04-21','Dimanche','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1));


-- ============================================================
-- 3. PLANNING SEMAINE SUIVANTE (28 Avril 2026)
-- ============================================================

INSERT INTO meal_plans (week_start_date, day, meal_type, recipe_id) VALUES

-- Lundi
('2026-04-28','Lundi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Yaourt grec fruits rouges et chia' LIMIT 1)),
('2026-04-28','Lundi','dejeuner',(SELECT id FROM recipes WHERE name='Salade niçoise légère' LIMIT 1)),
('2026-04-28','Lundi','diner',(SELECT id FROM recipes WHERE name='Escalope de dinde champignons et courgettes' LIMIT 1)),
('2026-04-28','Lundi','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1)),

-- Mardi
('2026-04-28','Mardi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Porridge avoine banane et miel' LIMIT 1)),
('2026-04-28','Mardi','dejeuner',(SELECT id FROM recipes WHERE name='Salade poulet grillé et avocat' LIMIT 1)),
('2026-04-28','Mardi','diner',(SELECT id FROM recipes WHERE name='Saumon four brocolis et patate douce' LIMIT 1)),
('2026-04-28','Mardi','collation',(SELECT id FROM recipes WHERE name='Oeufs durs et avocat' LIMIT 1)),

-- Mercredi
('2026-04-28','Mercredi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Omelette épinards et champignons' LIMIT 1)),
('2026-04-28','Mercredi','dejeuner',(SELECT id FROM recipes WHERE name='Soupe de lentilles corail et carottes' LIMIT 1)),
('2026-04-28','Mercredi','diner',(SELECT id FROM recipes WHERE name='Steak boeuf quinoa et courgettes sautées' LIMIT 1)),
('2026-04-28','Mercredi','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1)),

-- Jeudi
('2026-04-28','Jeudi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Pancakes protéinés avoine' LIMIT 1)),
('2026-04-28','Jeudi','dejeuner',(SELECT id FROM recipes WHERE name='Wrap dinde et crudités' LIMIT 1)),
('2026-04-28','Jeudi','diner',(SELECT id FROM recipes WHERE name='Poulet rôti riz basmati et haricots verts' LIMIT 1)),
('2026-04-28','Jeudi','collation',(SELECT id FROM recipes WHERE name='Oeufs durs et avocat' LIMIT 1)),

-- Vendredi
('2026-04-28','Vendredi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Yaourt grec fruits rouges et chia' LIMIT 1)),
('2026-04-28','Vendredi','dejeuner',(SELECT id FROM recipes WHERE name='Bowl quinoa dinde et légumes rôtis' LIMIT 1)),
('2026-04-28','Vendredi','diner',(SELECT id FROM recipes WHERE name='Cabillaud vapeur carottes et haricots verts' LIMIT 1)),
('2026-04-28','Vendredi','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1)),

-- Samedi
('2026-04-28','Samedi','petit_dejeuner',(SELECT id FROM recipes WHERE name='Porridge avoine banane et miel' LIMIT 1)),
('2026-04-28','Samedi','dejeuner',(SELECT id FROM recipes WHERE name='Salade niçoise légère' LIMIT 1)),
('2026-04-28','Samedi','diner',(SELECT id FROM recipes WHERE name='Gratin de courgettes au fromage blanc' LIMIT 1)),
('2026-04-28','Samedi','collation',(SELECT id FROM recipes WHERE name='Oeufs durs et avocat' LIMIT 1)),

-- Dimanche
('2026-04-28','Dimanche','petit_dejeuner',(SELECT id FROM recipes WHERE name='Omelette épinards et champignons' LIMIT 1)),
('2026-04-28','Dimanche','dejeuner',(SELECT id FROM recipes WHERE name='Salade poulet grillé et avocat' LIMIT 1)),
('2026-04-28','Dimanche','diner',(SELECT id FROM recipes WHERE name='Steak boeuf quinoa et courgettes sautées' LIMIT 1)),
('2026-04-28','Dimanche','collation',(SELECT id FROM recipes WHERE name='Fromage blanc fruits rouges et graines de chia' LIMIT 1));
