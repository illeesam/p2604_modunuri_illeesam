package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecBeBo.base.sy.repository.SyVendorContentRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyVendorContentService {

    private final SyVendorContentRepository syVendorContentRepository;

    @PersistenceContext
    private EntityManager em;

    /* 업체 콘텐츠 키조회 */
    public SyVendorContentDto.Item getById(String id) {
        // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 단건 조회
        SyVendorContentDto.Item dto = syVendorContentRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorContentDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 단건 조회
        return syVendorContentRepository.selectById(id).orElse(null);
    }

    /* 업체 콘텐츠 상세조회 */
    public SyVendorContent findById(String id) {
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 단건 조회
        return syVendorContentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorContent findByIdOrNull(String id) {
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 단건 조회
        return syVendorContentRepository.findById(id).orElse(null);
    }

    /* 업체 콘텐츠 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 존재 여부 확인
        return syVendorContentRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 존재 여부 확인
        if (!syVendorContentRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체 콘텐츠 목록조회 */
    public List<SyVendorContentDto.Item> getList(SyVendorContentDto.Request req) {
        // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 목록 조회
        return syVendorContentRepository.selectList(req);
    }

    /* 업체 콘텐츠 페이지조회 */
    public BasePage<SyVendorContentDto.Item> getPageData(SyVendorContentDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 페이지 조회
        return syVendorContentRepository.selectPageData(req);
    }

    /* 업체 콘텐츠 등록 */
    @Transactional
    public SyVendorContent create(SyVendorContent body) {
        body.setVendorContentId(CmUtil.generateId("sy_vendor_content"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 저장
        SyVendorContent saved = syVendorContentRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 업체 콘텐츠 수정 */
    @Transactional
    public SyVendorContent update(String id, SyVendorContent body) {
        CmUtil.requireId(id, "id", this);
        SyVendorContent entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorContentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 저장
        SyVendorContent saved = syVendorContentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체 콘텐츠 수정 */
    @Transactional
    public SyVendorContent updateSelective(SyVendorContent entity) {
        if (entity.getVendorContentId() == null) throw new CmBizException("vendorContentId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorContentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorContentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 선택적 필드 수정
        int affected = syVendorContentRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 업체 콘텐츠 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyVendorContent entity = findById(id);
        // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 삭제
        syVendorContentRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyVendorContent saveOneBase(SyVendorContent entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getVendorContentId());

        if ("D".equals(rowStatus)) {
            if (entity.getVendorContentId() == null)
                throw new CmBizException("삭제 대상 vendorContentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 존재 여부 확인
            if (!syVendorContentRepository.existsById(entity.getVendorContentId()))
                throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + entity.getVendorContentId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) ID 기준 삭제
            syVendorContentRepository.deleteById(entity.getVendorContentId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setVendorContentId(CmUtil.generateId("sy_vendor_content"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 저장
            SyVendorContent saved = syVendorContentRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getVendorContentId() == null)
                throw new CmBizException("수정 대상 vendorContentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 선택적 필드 수정
            int affected = syVendorContentRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + entity.getVendorContentId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getVendorContentId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SyVendorContent> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SyVendorContent row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getVendorContentId() == null || row.getVendorContentId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyVendorContent::getVendorContentId, "U", "vendorContentId", this);
        CmUtil.requireRowIds(rows, SyVendorContent::getVendorContentId, "D", "vendorContentId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyVendorContent::getVendorContentId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 조건별 삭제
            syVendorContentRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyVendorContent> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyVendorContent row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 선택적 필드 수정
            int affected = syVendorContentRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVendorContentId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SyVendorContent> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendorContent row : insertRows) {
            row.setVendorContentId(CmUtil.generateId("sy_vendor_content"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 판매/배송업체 콘텐츠 (회사소개/배너/약관 등) 저장
            syVendorContentRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
