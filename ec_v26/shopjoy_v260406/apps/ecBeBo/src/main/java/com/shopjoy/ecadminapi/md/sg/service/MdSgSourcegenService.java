package com.shopjoy.ecadminapi.md.sg.service;

import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgSourcegenDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegen;
import com.shopjoy.ecadminapi.md.sg.repository.MdSgSourcegenRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MdSgSourcegen — 소스젠 DDL 탭. 개별 CRUD 대신 프로젝트(projectId) 단위 전체 교체(replaceAll)로만 다룬다
 * (프론트에서 DDL 탭 10개를 편집한 뒤 [저장] 시 현재 화면 상태 전체를 한 번에 보낸다).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdSgSourcegenService {

    private final MdSgSourcegenRepository mdSgSourcegenRepository;

    @PersistenceContext
    private EntityManager em;

    public List<MdSgSourcegenDto.Item> getByProjectId(String projectId) {
        CmUtil.requireId(projectId, "projectId", this);
        // [쿼리 메서드] 소스젠 DDL 정의 — 프로젝트당 여러 테이블 DDL 보관 조건별 조회
        return mdSgSourcegenRepository.findByProjectIdOrderByTabNoAsc(projectId).stream()
            .map(e -> {
                MdSgSourcegenDto.Item item = new MdSgSourcegenDto.Item();
                item.setSourcegenId(e.getSourcegenId());
                item.setProjectId(e.getProjectId());
                item.setTabNo(e.getTabNo());
                item.setDdlText(e.getDdlText());
                item.setSchemaNm(e.getSchemaNm());
                item.setTableNm(e.getTableNm());
                item.setClassNm(e.getClassNm());
                item.setEndpoint(e.getEndpoint());
                item.setSwaggerTag(e.getSwaggerTag());
                item.setSubPackage(e.getSubPackage());
                item.setSortOrd(e.getSortOrd());
                item.setUseYn(e.getUseYn());
                return item;
            }).toList();
    }

    /** replaceAll — 이 프로젝트의 기존 DDL 탭을 모두 지우고 넘어온 rows로 다시 채운다(전체 교체 저장) */
    @Transactional
    public void replaceAll(String projectId, List<MdSgSourcegen> rows) {
        CmUtil.requireId(projectId, "projectId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // [쿼리 메서드] 프로젝트 DDL 탭 전체 삭제
        mdSgSourcegenRepository.deleteByProjectId(projectId);
        em.flush();

        int seq = 0;
        for (MdSgSourcegen row : rows) {
            if (row.getTabNo() == null) {
                throw new CmBizException("DDL 탭에 tabNo 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
            }
            row.setSourcegenId(CmUtil.generateId("sg_sourcegen"));
            row.setProjectId(projectId);
            if (row.getSortOrd() == null) row.setSortOrd(seq++);
            if (row.getUseYn() == null) row.setUseYn("Y");
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
        }
        // [쿼리 메서드] 소스젠 DDL 정의 — 프로젝트당 여러 테이블 DDL 보관 일괄 저장
        mdSgSourcegenRepository.saveAll(rows);

        em.flush();
        em.clear();
    }
}
