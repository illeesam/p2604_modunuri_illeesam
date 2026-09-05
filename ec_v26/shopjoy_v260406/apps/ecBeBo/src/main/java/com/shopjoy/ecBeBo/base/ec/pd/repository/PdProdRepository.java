package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdRepository;

import java.util.List;

public interface PdProdRepository extends JpaRepository<PdProd, String>, QPdProdRepository {

    /** 판매상태 자동 동기화 배치 대상 — prodStatusCd 가 지정 목록에 포함된 상품 전체 */
    List<PdProd> findByProdStatusCdIn(List<String> prodStatusCds);
}
