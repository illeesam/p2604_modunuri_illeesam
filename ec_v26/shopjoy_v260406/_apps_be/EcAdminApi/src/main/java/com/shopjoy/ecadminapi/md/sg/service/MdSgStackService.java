package com.shopjoy.ecadminapi.md.sg.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgStackDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgStack;
import com.shopjoy.ecadminapi.md.sg.repository.MdSgStackRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MdSgStack — 소스젠 [소스 생성] 팝오버에 노출되는 언어/스택 카탈로그.
 * BO 에서 관리하며, FO 소스젠 편집기(MdSgSourcegenPage)가 조회해 체크리스트를 그린다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdSgStackService {

    private final MdSgStackRepository mdSgStackRepository;

    @PersistenceContext
    private EntityManager em;

    public MdSgStackDto.Item getById(String id) {
        // [QueryDSL] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 단건 조회
        MdSgStackDto.Item dto = mdSgStackRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public MdSgStack findById(String id) {
        // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 단건 조회
        return mdSgStackRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 존재 여부 확인
        return mdSgStackRepository.existsById(id);
    }

    public List<MdSgStackDto.Item> getList(MdSgStackDto.Request req) {
        // [QueryDSL] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 목록 조회
        return mdSgStackRepository.selectList(req);
    }

    public BasePage<MdSgStackDto.Item> getPageData(MdSgStackDto.Request req) {
        // [QueryDSL] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 페이지 조회
        return mdSgStackRepository.selectPageData(req);
    }

    @Transactional
    public MdSgStack create(MdSgStack body) {
        body.setStackId(CmUtil.generateId("sg_stack"));
        if (body.getVersionList() == null) body.setVersionList("v1");
        if (body.getDefaultVersion() == null) body.setDefaultVersion("v1");
        if (body.getSortOrd() == null) body.setSortOrd(0);
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 저장
        MdSgStack saved = mdSgStackRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MdSgStack update(String id, MdSgStack body) {
        CmUtil.requireId(id, "id", this);
        MdSgStack entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "stackId^siteId^regSiteId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 저장
        MdSgStack saved = mdSgStackRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdSgStack entity = findById(id);
        // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 삭제
        mdSgStackRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveListBase — CRUD 그리드 일괄 저장(DELETE→UPDATE→INSERT 단계별). cmd: "base"=기본 흐름.
     *  BoGridCrud 표준(SyBrandService.saveListBase 와 동일 패턴) — 드래그앤드롭 정렬 포함 전체 교체 저장. */
    @Transactional
    public void saveListBase(List<MdSgStack> rows) {
        for (MdSgStack row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getStackId() == null || row.getStackId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MdSgStack::getStackId, "U", "stackId", this);
        CmUtil.requireRowIds(rows, MdSgStack::getStackId, "D", "stackId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(MdSgStack::getStackId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 조건별 삭제
            mdSgStackRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective (정렬순서 드래그앤드롭도 여기서 반영)
        List<MdSgStack> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (MdSgStack row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 선택적 필드 수정
            int affected = mdSgStackRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getStackId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<MdSgStack> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MdSgStack row : insertRows) {
            row.setStackId(CmUtil.generateId("sg_stack"));
            if (row.getVersionList() == null) row.setVersionList("v1");
            if (row.getDefaultVersion() == null) row.setDefaultVersion("v1");
            if (row.getSortOrd() == null) row.setSortOrd(0);
            if (row.getUseYn() == null) row.setUseYn("Y");
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스 저장
            mdSgStackRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}
