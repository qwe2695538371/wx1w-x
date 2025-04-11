from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity,
    jwt_required, verify_jwt_in_request
)
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from flask.cli import with_appcontext
import click
import requests
import os
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from flask_cors import CORS
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)  # 添加CORS支持

# 配置数据库和JWT
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-super-secret-key-2025'  # 生产环境应使用环境变量[1,4](@ref)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# 初始化扩展
db = SQLAlchemy(app)
jwt = JWTManager(app)

# 微信配置
WX_APPID = 'wxb5e4c7c503bd5e73'
WX_SECRET = 'd4c044080fd59e6e17c4b5334df9c730'


# --- 数据模型 ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    openid = db.Column(db.String(128), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Bill(db.Model):
    __tablename__ = 'bills'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# --- 辅助函数 ---
def validate_amount(value):
    """金额验证逻辑[6](@ref)"""
    try:
        amount = float(value)
        if amount <= 0:
            raise ValueError
        return round(amount, 2)
    except (TypeError, ValueError):
        raise ValueError("无效的金额格式")


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not all(k in data for k in ['username', 'password']):
        return jsonify({
            'success': False,
            'message': '缺少必要参数'
        }), 400

    try:
        user = User.query.filter_by(username=data['username']).first()
        if user and check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'success': True,
                'access_token': access_token,
                'user_id': user.id
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401

    except Exception as e:
        return jsonify({
            'success': False,
            'message': '登录失败，请稍后重试'
        }), 500

# 修改微信登录路由
@app.route('/api/wx_login', methods=['POST'])
def wx_login():
    try:
        code = request.json.get('code')
        if not code:
            return jsonify({
                'success': False,
                'message': '缺少code参数'
            }), 400

        # 获取微信openid
        wx_url = f"https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": WX_APPID,
            "secret": WX_SECRET,
            "js_code": code,
            "grant_type": "authorization_code"
        }
        response = requests.get(wx_url, params=params)

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': '微信服务不可用'
            }), 502

        wx_data = response.json()
        if 'errcode' in wx_data:
            return jsonify({
                'success': False,
                'message': wx_data.get('errmsg')
            }), 400

        openid = wx_data['openid']
        user = User.query.filter_by(openid=openid).first()

        if user:
            # 已注册用户，创建token
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'success': True,
                'access_token': access_token,
                'user_id': user.id,
                'registered': True
            }), 200
        else:
            # 未注册用户
            return jsonify({
                'success': True,
                'openid': openid,
                'registered': False
            }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


# --- 账单路由 ---
@app.route('/api/bills', methods=['POST', 'GET', 'DELETE'])
@jwt_required()
def handle_bills():
    try:
        # 验证 JWT token
        verify_jwt_in_request()
        current_user = get_jwt_identity()

        if not current_user:
            return jsonify({"error": "无效的用户身份"}), 401

        if request.method == 'GET':
            try:
                bills = Bill.query.filter_by(user_id=current_user) \
                    .order_by(Bill.timestamp.desc()) \
                    .all()

                return jsonify([{
                    "id": bill.id,
                    "category": bill.category,
                    "amount": float(bill.amount),
                    "timestamp": bill.timestamp.isoformat()
                } for bill in bills]), 200

            except Exception as e:
                db.session.rollback()
                return jsonify({
                    "error": "获取账单失败",
                    "message": str(e)
                }), 500

        elif request.method == 'DELETE':
            bill_id = request.args.get('id')
            if not bill_id:
                return jsonify({"error": "缺少账单ID"}), 400

            try:
                bill = Bill.query.filter_by(
                    id=bill_id,
                    user_id=current_user
                ).first()

                if not bill:
                    return jsonify({"error": "账单不存在"}), 404

                db.session.delete(bill)
                db.session.commit()
                return jsonify({"success": True}), 200

            except Exception as e:
                db.session.rollback()
                return jsonify({
                    "error": "删除失败",
                    "message": str(e)
                }), 500

        elif request.method == 'POST':
            data = request.json
            if not all(k in data for k in ('category', 'amount', 'timestamp')):
                return jsonify({"error": "缺少必要字段"}), 400

            try:
                amount = validate_amount(data['amount'])
                timestamp = datetime.fromisoformat(data['timestamp'])

                new_bill = Bill(
                    user_id=current_user,
                    category=data['category'],
                    amount=amount,
                    timestamp=timestamp
                )
                db.session.add(new_bill)
                db.session.commit()

                return jsonify({
                    "id": new_bill.id,
                    "category": new_bill.category,
                    "amount": new_bill.amount,
                    "timestamp": new_bill.timestamp.isoformat()
                }), 201

            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                db.session.rollback()
                return jsonify({
                    "error": "创建账单失败",
                    "message": str(e)
                }), 500

    except Exception as e:
        return jsonify({
            "error": "认证失败",
            "message": str(e)
        }), 401


# 添加一个错误处理装饰器
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        "error": "无效的token",
        "message": str(error)
    }), 422


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({
        "error": "token已过期",
        "message": "请重新登录"
    }), 422


# --- 其他路由 ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json

    # 参数验证
    if not data or not all(k in data for k in ['username', 'password']):
        return jsonify({
            'success': False,
            'message': '缺少必要参数'
        }), 400

    # 用户名验证
    if len(data['username']) < 3:
        return jsonify({
            'success': False,
            'message': '用户名至少3位'
        }), 400

    # 密码验证
    if len(data['password']) < 8:  # 后端密码长度要求为8位
        return jsonify({
            'success': False,
            'message': '密码至少8位'
        }), 400

    try:
        hashed_pw = generate_password_hash(data['password'])
        new_user = User(
            username=data['username'],
            password_hash=hashed_pw,
            openid=data.get('openid')
        )
        db.session.add(new_user)
        db.session.commit()

        # 修改返回格式以匹配前端期望
        return jsonify({
            'success': True,
            'message': '注册成功',
            'user_id': new_user.id
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '用户名或OpenID已存在'
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '注册失败，请稍后重试'
        }), 500


def init_db():
    """初始化数据库"""
    with app.app_context():
        try:
            db.create_all()

            # 检查管理员账户
            if not User.query.filter_by(username='admin').first():
                admin = User(
                    username='admin',
                    password_hash=generate_password_hash('admin123'),
                    openid='system-init'
                )
                db.session.add(admin)
                db.session.commit()
                print('✅ 数据库初始化成功')
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f'❌ 数据库初始化失败: {str(e)}')
            raise

@app.errorhandler(SQLAlchemyError)
def handle_db_error(error):
    """处理数据库错误"""
    db.session.rollback()
    return jsonify({
        "error": "数据库操作错误",
        "message": str(error)
    }), 500
@click.command(name='init-db')
@with_appcontext
def init_db_command():
    """初始化数据库并创建初始账户"""
    db.create_all()

    # 检查是否存在初始账户
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            password=generate_password_hash('admin123'),  # 密码加密
            openid='system-init'  # 特殊标识
        )
        db.session.add(admin)
        db.session.commit()
        click.echo('✅ 数据库已初始化，管理员账户创建成功')
    else:
        click.echo('⚠️ 数据库已存在，跳过初始化')


if __name__ == '__main__':
    if not os.path.exists('app.db'):
        init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)