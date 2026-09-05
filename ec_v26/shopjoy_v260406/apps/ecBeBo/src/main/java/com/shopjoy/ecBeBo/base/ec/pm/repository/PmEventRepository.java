package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmEventRepository;

import java.util.List;

public interface PmEventRepository extends JpaRepository<PmEvent, String>, QPmEventRepository {

    /** 상태 자동 동기화 배치 대상 — eventStatusCd 가 지정 목록에 포함된 이벤트 */
    List<PmEvent> findByUseYnAndEventStatusCdIn(String useYn, List<String> eventStatusCds);
}
