package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorContentRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
        SyVendorContentDto.Item dto = syVendorContentRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorContentDto.Item getByIdOrNull(String id) {
        return syVendorContentRepository.selectById(id).orElse(null);
    }

    /* 업체 콘텐츠 상세조회 */
    public SyVendorContent findById(String id) {
        return syVendorContentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorContent findByIdOrNull(String id) {
        return syVendorContentRepository.findById(id).orElse(null);
    }

    /* 업체 콘텐츠 키검증 */
    public boolean existsById(String id) {
        return syVendorContentRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorContentRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체 콘텐츠 목록조회 */
    public List<SyVendorContentDto.Item> getList(SyVendorContentDto.Request req) {
        return syVendorContentRepository.selectList(req);
    }

    /* 업체 콘텐츠 페이지조회 */
    public SyVendorContentDto.PageResponse getPageData(SyVendorContentDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorContentRepository.selectPageList(req);
    }

    /* 업체 콘텐츠 등록 */
    @Transactional
    public SyVendorContent create(SyVendorContent body) {
        body.setVendorContentId(CmUtil.generateId("sy_vendor_content"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
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
        int affected = syVendorContentRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 업체 콘텐츠 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyVendorContent entity = findById(id);
        syVendorContentRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyVendorContent save(String cmd, SyVendorContent entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getVendorContentId() == null || entity.getVendorContentId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getVendorContentId() == null)
                    throw new CmBizException("삭제 대상 vendorContentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syVendorContentRepository.existsById(entity.getVendorContentId()))
                    throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + entity.getVendorContentId() + "::" + CmUtil.svcCallerInfo(this));
                syVendorContentRepository.deleteById(entity.getVendorContentId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setVendorContentId(CmUtil.generateId("sy_vendor_content"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyVendorContent saved = syVendorContentRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getVendorContentId() == null)
                    throw new CmBizException("수정 대상 vendorContentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syVendorContentRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + entity.getVendorContentId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getVendorContentId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyVendorContent> rows) {
        if ("base".equals(cmd)) {
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
                syVendorContentRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyVendorContent> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyVendorContent row : updateRows) {
                row.setUpdBy(authId);
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
                syVendorContentRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
