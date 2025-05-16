from flask import Flask, render_template, jsonify, request
import psycopg2
from collections import defaultdict
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)

CORS(app)

@app.route('/update_item_level', methods=['POST'])
def update_item_level():
    con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="176.124.212.234",
                           port="5432")
    user_id = request.json.get('userId')
    hero_id = request.json.get('heroId')
    item_id = request.json.get('itemId')
    current_level = request.json.get('currentLevel', 1)
    current_value = request.json.get('currentValue', 1)
    cost = request.json.get('cost', 0)
    current_price = request.json.get('currentPrice', 0)
    max_health = request.json.get('maxHealth')
    health_regen = request.json.get('healthRegen')
    max_energy = request.json.get('maxEnergy')
    energy_regen = request.json.get('energyRegen')
    damage = request.json.get('damage')
    speed = request.json.get('movementSpeed')
    vampirism = request.json.get('vampirism')
    current_income = request.json.get('currentIncome', 0)
    with con.cursor() as cursor:
        # 🔍 Получаем предыдущие значения из user_money для логов
        cursor.execute(f'''
            SELECT current_money, offline_money, last_updated
            FROM public.user_money
            WHERE user_id = {user_id} AND hero_id = {hero_id}
        ''')
        result = cursor.fetchone()
        if result:
            prev_money, prev_income, prev_last_updated = result
            seconds_passed = (datetime.now() - prev_last_updated).total_seconds()
            accumulated = round(seconds_passed * prev_income)

            print("🧾 === DEBUG: Покупка ===")
            print(f"Пользователь: {user_id}, Герой: {hero_id}")
            print(f"Золото до: {prev_money}")
            print(f"Доход в сек: {prev_income}")
            print(f"Прошло секунд: {seconds_passed:.2f}")
            print(f"Накопилось золота: {accumulated}")
            print(f"Стоимость покупки: {cost}")
            print(f"Будет записано: {prev_money + accumulated - cost}")
            print("🧾 =======================\n")

    with con.cursor() as cursor:
        # Сбросить всех героев пользователя до False, чтобы потом установить выбранного в True
        cursor.execute(f'''update public.user_money
                                set is_current_hero = False
                                where user_id = {user_id}''')
        # При отсутствии в таблице public.user_money id пользователя и id персонажа, создать запись. Сохранить в нее текущее золото и income
        # Если такая информация уже есть в таблице, обновить запись текущими значениями золота и income
        cursor.execute(f'''insert into public.user_money (user_id, hero_id, current_money, offline_money, last_updated, is_current_hero)
                                values({user_id}, {hero_id}, {cost}, {current_income}, current_timestamp, True)
                                on conflict(user_id, hero_id)
                                do update
                                    set current_money = user_money.current_money - {cost} + 
                                    (SELECT ROUND(EXTRACT(EPOCH FROM NOW() - last_updated)*offline_money) from user_money where user_id = {user_id}),
                                        last_updated = current_timestamp,
                                        offline_money = {current_income},
                                        is_current_hero = True;''')
        # При первой покупке предмета, внести в таблицу public.user_item его уровень, значение и цену
        # При наличии предмета, обновить его уровень, значение и цену
        cursor.execute(f'''insert into public.user_item (user_id, hero_id, item_id, current_level, current_value, 
                                                            last_updated, current_price)
                                values({user_id}, {hero_id}, {item_id}, {current_level}, {current_value}, 
                                        current_timestamp, {current_price})
                                on conflict(user_id, item_id, hero_id)
                                do update
                                    set current_level = {current_level},
                                        current_value = {current_value},
                                        current_price = {current_price},
                                        last_updated = current_timestamp;''')
        # Занести/Обновить в таблице public.user_hero параметры max_health, health_regen, max_energy, energy_regen, damage и
        cursor.execute(f'''insert into public.user_hero (user_id, hero_id, max_health, health_regen, 
                                                            max_energy, energy_regen, damage, movement_speed, vampirism)
                                        values({user_id}, {hero_id}, {max_health}, {health_regen}, 
                                                {max_energy}, {energy_regen}, {damage}, {speed}, {vampirism})
                                        on conflict(user_id, hero_id)
                                        do update
                                            set max_health = {max_health},
                                                health_regen = {health_regen},
                                                max_energy = {max_energy},
                                                energy_regen = {energy_regen},
                                                movement_speed = {speed},
                                                vampirism = {vampirism},
                                                damage = {damage};''')
        con.commit()
    con.close()
    return jsonify({'message': 'completed'})


@app.route('/update_user_money', methods=['POST'])
def update_user_money():
    # con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="localhost", port="5432")
    con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="176.124.212.234",
                           port="5432")
    user_id = request.json.get('userId')
    hero_id = request.json.get('heroId')
    income = request.json.get('income', 0)
    with con.cursor() as cursor:
        if hero_id is None:
            cursor.execute(f'''select coalesce(hero_id, 1) from public.user_money
                                where is_current_hero and user_id = {user_id}''')
            hero_id = cursor.fetchone()[0]
        cursor.execute(f'''update public.user_money
                                set is_current_hero = False
                                where user_id = {user_id}''')
        cursor.execute(f'''insert into public.user_money (user_id, hero_id, current_money, offline_money, last_updated, is_current_hero)
                                        values({user_id}, {hero_id}, {income}, 0, current_timestamp, True)
                                        on conflict(user_id, hero_id)
                                        do update
                                            set current_money = public.user_money.current_money + {income} + 
                                            (SELECT ROUND(EXTRACT(EPOCH FROM NOW() - last_updated)*offline_money) from user_money where user_id = {user_id}),
                                                last_updated = current_timestamp,
                                                is_current_hero = True;''')
        con.commit()
    con.close()
    return jsonify({'message': 'completed'})


@app.route('/hero_data', methods=['GET'])
def get_hero_data():
    # con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="localhost", port="5432")
    con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="176.124.212.234",
                           port="5432")
    user_id = request.args.get('userId')
    hero_id = request.args.get('heroId')
    print(user_id, hero_id, 'ids')
    result_dict = {}
    with con.cursor() as cursor:
        if hero_id is not None:
            cursor.execute(f'''update public.user_money
                                            set is_current_hero = case when hero_id = {hero_id} then True 
                                                    else False end
                                            where user_id = {user_id}''')
            con.commit()
        else:
            cursor.execute(f'''select coalesce((select hero_id from public.user_money
                                where is_current_hero and user_id = {user_id}),1) as hero_id''')
            hero_id = cursor.fetchone()[0]
        cursor.execute(f'''select h.hero_id, 
                                    h.hero_name, 
                                    coalesce(um.current_money, 0),
                                    coalesce(uh.max_health, h.max_health), 
                                    coalesce(uh.health_regen, h.health_regen), 
                                    coalesce(uh.max_energy, h.max_energy), 
                                    coalesce(uh.energy_regen, h.energy_regen),
                                    coalesce(uh.damage, h.damage),
                                    coalesce(uh.movement_speed, h.movement_speed),
                                    coalesce(uh.vampirism, h.vampirism),
                                    coalesce(um.offline_money, 0),
                                    coalesce(uh.level, 0)
                                from public.heroes h
                                left join public.user_money um 
                                on um.hero_id = h.hero_id and um.user_id = {user_id}
                                left join public.user_hero uh
                                on uh.hero_id = um.hero_id and um.user_id = uh.user_id
                                where h.hero_id = {hero_id}''')
        element = cursor.fetchone()
        # print(element)
        # print(element[10], element[11], element[12], int((element[12] - element[11]).total_seconds()) * element[10])
        result_dict['heroId'] = hero_id
        result_dict['heroName'] = element[1]
        result_dict['userId'] = user_id
        result_dict['coins'] = element[2]
        # result_dict['coins'] = element[2] + int((element[12] - element[11]).total_seconds()) * element[10] if int(
            # (element[12] - element[11]).total_seconds()) < 28800 else 28800 * element[10]
        result_dict['maxHealth'] = element[3]
        result_dict['healthRegen'] = element[4]
        result_dict['maxEnergy'] = element[5]
        result_dict['energyRegen'] = element[6]
        result_dict['damage'] = element[7]
        result_dict['movementSpeed'] = element[8]
        result_dict['vampirism'] = element[9]
        result_dict['currentIncome'] = element[10]
        result_dict['level'] = element[11]
    con.close()
    return jsonify(result_dict)


@app.route('/hero_items', methods=['GET'])
def get_user_data():
    # con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="localhost", port="5432")
    con = psycopg2.connect(dbname="cliker_dota_db", user="cliker", password="cliker", host="176.124.212.234",
                           port="5432")
    user_id = request.args.get('userId')
    hero_id = request.args.get('heroId')
    result_dict = defaultdict(defaultdict)
    with con.cursor() as cursor:
        if hero_id is not None:
            # print(hero_id)
            cursor.execute(f'''update public.user_money
                                set is_current_hero = case when hero_id = {hero_id} then True 
                                        else False end
                                where user_id = {user_id}''')
            con.commit()
        else:
            cursor.execute(f'''select hero_id from public.user_money
                                where is_current_hero and user_id = {user_id}''')
            hero_id = cursor.fetchone()[0]
        cursor.execute(f'''with user_item_m as (select ui.item_id, ui.current_level, ui.current_value, ui.current_price
                                    from public.user_item ui 
                                    inner join public.user_money um on um.user_id = ui.user_id and um.hero_id = ui.hero_id 
                                    where um.user_id = {user_id} and um.is_current_hero)
                                select id.shop_category, 
                                        id.item_id, 
                                        id.item_name,
                                        id.base_value,
                                        coalesce(uim.current_level, 0) as current_level, 
                                        coalesce(uim.current_value,  id.base_value) as current_value,
                                        coalesce (uim.current_price, id.base_price) as current_price
                                from public.item_dict id 
                                left join user_item_m uim on id.item_id = uim.item_id;''')
        for element in cursor.fetchall():
            result_dict[element[0]][element[1]] = {'itemId': element[1],
                                            'itemName': element[2],
                                            'baseValue': element[3],
                                            'currentLevel': element[4],
                                            'currentValue': element[5],
                                            'currentPrice': element[6]}
    con.close()
    return jsonify({'userId': user_id, 'heroId': hero_id, 'items': result_dict})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
