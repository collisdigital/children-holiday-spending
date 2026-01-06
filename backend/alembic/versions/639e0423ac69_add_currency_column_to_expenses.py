"""add currency column to expenses

Revision ID: 639e0423ac69
Revises: 181c739d87e8
Create Date: 2026-01-06 12:11:34.964889

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '639e0423ac69'
down_revision: Union[str, Sequence[str], None] = '181c739d87e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('expenses', sa.Column('currency', sa.String(), server_default='EUR', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('expenses', 'currency')
