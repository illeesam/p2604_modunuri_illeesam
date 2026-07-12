package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptItemRepository;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * @deprecated 2026-07-12 PdProdOptRepository 로 통합됨 (pd_prod_opt_item → pd_prod_opt 테이블 rename).
 * 이 Repository는 삭제 예정. 모든 참조는 PdProdOptRepository 로 변경할 것.
 */
@Deprecated
public interface PdProdOptItemRepository extends JpaRepository<PdProdOpt, String>, QPdProdOptItemRepository {
}
