package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdTagRepository;
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
public class PdProdTagService {

    private final PdProdTagRepository pdProdTagRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 태그 키조회 */
    public PdProdTagDto.Item getById(String id) {
        PdProdTagDto.Item dto = pdProdTagRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdTagDto.Item getByIdOrNull(String id) {
        return pdProdTagRepository.selectById(id).orElse(null);
    }

    /* 상품 태그 상세조회 */
    public PdProdTag findById(String id) {
        return pdProdTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdTag findByIdOrNull(String id) {
        return pdProdTagRepository.findById(id).orElse(null);
    }

    /* 상품 태그 키검증 */
    public boolean existsById(String id) {
        return pdProdTagRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdTagRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 태그 목록조회 */
    public List<PdProdTagDto.Item> getList(PdProdTagDto.Request req) {
        return pdProdTagRepository.selectList(req);
    }

    /* 상품 태그 페이지조회 */
    public PdProdTagDto.PageResponse getPageData(PdProdTagDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdTagRepository.selectPageList(req);
    }

    /* 상품 태그 등록 */
    @Transactional
    public PdProdTag create(PdProdTag body) {
        body.setProdTagId(CmUtil.generateId("pd_prod_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdTag saved = pdProdTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 태그 수정 */
    @Transactional
    public PdProdTag update(String id, PdProdTag body) {
        CmUtil.requireId(id, "id", this);
        PdProdTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodTagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdTag saved = pdProdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 태그 수정 */
    @Transactional
    public PdProdTag updateSelective(PdProdTag entity) {
        if (entity.getProdTagId() == null) throw new CmBizException("prodTagId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdTagRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 태그 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdTag entity = findById(id);
        pdProdTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProdTag save(String cmd, PdProdTag entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getProdTagId() == null || entity.getProdTagId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getProdTagId() == null)
                    throw new CmBizException("삭제 대상 prodTagId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdProdTagRepository.existsById(entity.getProdTagId()))
                    throw new CmBizException("존재하지 않는 PdProdTag입니다: " + entity.getProdTagId() + "::" + CmUtil.svcCallerInfo(this));
                pdProdTagRepository.deleteById(entity.getProdTagId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setProdTagId(CmUtil.generateId("pd_prod_tag"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdProdTag saved = pdProdTagRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getProdTagId() == null)
                    throw new CmBizException("수정 대상 prodTagId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdProdTagRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdProdTag입니다: " + entity.getProdTagId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getProdTagId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdProdTag> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PdProdTag row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getProdTagId() == null || row.getProdTagId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PdProdTag::getProdTagId, "U", "prodTagId", this);
            CmUtil.requireRowIds(rows, PdProdTag::getProdTagId, "D", "prodTagId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PdProdTag::getProdTagId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pdProdTagRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdProdTag> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdProdTag row : updateRows) {
                row.setUpdBy(authId);
                int affected = pdProdTagRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdTagId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PdProdTag> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PdProdTag row : insertRows) {
                row.setProdTagId(CmUtil.generateId("pd_prod_tag"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdTagRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
